import { z } from "zod";
import { createHash } from "node:crypto";
import {
  authorize,
  apiError,
  verifyMutation,
} from "@/lib/auth/server";
import { db } from "@/lib/firebase/admin";
export async function POST(req: Request) {
  try {
    await verifyMutation(req);
    const user = await authorize();
    const { token } = z
      .object({ token: z.string().min(20).max(4000) })
      .parse(await req.json());
    const id = createHash("sha256").update(token).digest("hex");
    await db()
      .doc(`users/${user.uid}/pushTokens/${id}`)
      .set({
        token,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    return Response.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
export async function GET() { return Response.json({error:"Medicine reminders have been removed."},{status:410}); }
