import { z } from "zod";
import {
  authorize,
  apiError,
  verifyMutation,
  APIError,
} from "@/lib/auth/server";
import { db, bucket } from "@/lib/firebase/admin";
import { generateHealth } from "@/lib/ai/service";
import { ocr } from "@/lib/ocr";
import { aiInputSchema, maxFileSize } from "@/lib/validation";
export const maxDuration = 90;
export async function POST(
  req: Request,
  { params }: { params: Promise<{ kind: string }> },
) {
  try {
    await verifyMutation(req);
    const user = await authorize();
    const kind = z
      .enum([
        "chat",
        "prescription",
        "symptoms",
        "report",
        "nutrition",
        "recommendations",
      ])
      .parse((await params).kind);
    const input = aiInputSchema.parse(await req.json());
    if(!process.env.GEMINI_API_KEY) throw new APIError(503,'The AI service is not connected yet. Please ask the administrator to configure Gemini.');
    if((kind==='prescription'||kind==='report')&&input.consent!==true) throw new APIError(400,'Consent is required before sending this document for AI analysis.');
    const rateRef = db().doc(`rateLimits/${user.uid}`);
    await db().runTransaction(async (tx) => {
      const current = await tx.get(rateRef);
      const now = Date.now();
      const reset = !current.exists || now - current.data()!.start > 60000;
      const count = reset ? 0 : current.data()!.count;
      if (count >= 10)
        throw new APIError(429, "Please wait a minute before asking again.");
      tx.set(rateRef, {
        start: reset ? now : current.data()!.start,
        count: count + 1,
      });
    });
    let result;
    let conversationId = input.conversationId;
    let prompt = input.prompt;
    if (kind === "chat" && conversationId) {
      const history = await db()
        .collection(
          `users/${user.uid}/conversations/${conversationId}/messages`,
        )
        .orderBy("createdAt", "desc")
        .limit(12)
        .get();
      prompt = `Previous messages for context:\n${history.docs
        .reverse()
        .map((d) => `${d.data().role}: ${JSON.stringify(d.data().content)}`)
        .join("\n")}\nCurrent message: ${prompt}`;
    }
    if (kind === "prescription" || kind === "report") {
      if (
        !input.storagePath?.startsWith(
          `users/${user.uid}/${kind === "report" ? "health-reports" : "prescriptions"}/`,
        ) ||
        input.storagePath.includes("..")
      )
        throw new APIError(403, "Upload your document before analyzing it.");
      const file = bucket().file(input.storagePath);
      const [meta] = await file.getMetadata();
      if (Number(meta.size) > maxFileSize)
        throw new APIError(413, "The document is too large.");
      const [buffer] = await file.download();
      result = await ocr.extract(
        {
          mimeType: meta.contentType || "application/pdf",
          data: buffer.toString("base64"),
        },
        kind,
        prompt,
      );
    } else result = await generateHealth(kind, prompt);
    const now = new Date().toISOString();
    const batch = db().batch();
    if (kind === "chat") {
      conversationId ??= db()
        .collection(`users/${user.uid}/conversations`)
        .doc().id;
      const ref = db().doc(`users/${user.uid}/conversations/${conversationId}`);
      batch.set(
        ref,
        {
          title: input.prompt.slice(0, 65),
          updatedAt: now,
          ...(!input.conversationId ? { createdAt: now } : {}),
        },
        { merge: true },
      );
      batch.create(ref.collection("messages").doc(), {
        role: "user",
        content: input.prompt,
        createdAt: now,
        updatedAt: now,
      });
      batch.create(ref.collection("messages").doc(), {
        role: "assistant",
        content: result,
        createdAt: new Date(Date.now() + 1).toISOString(),
        updatedAt: now,
      });
    }
    if (kind === "nutrition")
      batch.create(db().collection(`users/${user.uid}/nutritionPlans`).doc(), {
        name: "Personal nutrition plan",
        plan: result,
        createdAt: now,
        updatedAt: now,
      });
    if (kind === "report")
      batch.create(db().collection(`users/${user.uid}/notifications`).doc(), {
        title: "Report analysis ready",
        message: "Your AI report summary is ready to review.",
        type: "report",
        read: false,
        createdAt: now,
        updatedAt: now,
      });
    await batch.commit();
    return Response.json({ result, conversationId });
  } catch (e) {
    return apiError(e);
  }
}
export async function GET(req: Request) {
  try {
    const user = await authorize();
    const id = z
      .string()
      .regex(/^[\w-]{1,128}$/)
      .parse(new URL(req.url).searchParams.get("conversationId"));
    const messages = await db()
      .collection(`users/${user.uid}/conversations/${id}/messages`)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();
    return Response.json({
      records: messages.docs.reverse().map((d) => ({ ...d.data(), id: d.id })),
    });
  } catch (e) {
    return apiError(e);
  }
}
