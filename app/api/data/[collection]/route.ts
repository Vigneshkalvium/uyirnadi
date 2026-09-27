import { z } from "zod";
import type { Query } from "firebase-admin/firestore";
import {FieldPath} from 'firebase-admin/firestore';
import {
  authorize,
  apiError,
  verifyMutation,
  APIError,
} from "@/lib/auth/server";
import { db, bucket } from "@/lib/firebase/admin";
import { schemas } from "@/lib/validation";
import { collectionPath, canMutate } from "@/lib/firestore/access";
type Context = { params: Promise<{ collection: string }> };
export async function GET(req: Request, ctx: Context) {
  try {
    const user = await authorize();
    const { collection: name } = await ctx.params;
    const params = new URL(req.url).searchParams;
    let path = collectionPath(name, user.uid);
    if (name === "availability" && params.get("doctorId")) {
      const id = z
        .string()
        .regex(/^[a-zA-Z0-9_-]{1,128}$/)
        .parse(params.get("doctorId"));
      path = `doctors/${id}/availability`;
    }
    let query: Query = db().collection(path);
    if (name === "users" && user.role !== "admin")
      throw new APIError(403, "Administrator access is required.");
    if (name === "feedback" && user.role !== "admin")
      query = query.where("userId", "==", user.uid);
    if (name === "appointments" && user.role !== "admin")
      query = query.where(
        user.role === "doctor" ? "doctorId" : "userId",
        "==",
        user.uid,
      );
    if (name === "doctors" && user.role !== "admin")
      query = query.where("active", "==", true);
    if (name === "healthTips" && user.role !== "admin")
      query = query.where("published", "==", true);
    // Scoped equality queries page by document ID, using built-in indexes.
    // Avoid requiring a composite createdAt index just to display a list.
    const scoped = (name==='feedback'||name==='appointments'||name==='doctors'||name==='healthTips') && user.role!=='admin';
    query = scoped ? query.orderBy(FieldPath.documentId()) : query.orderBy('createdAt','desc');
    const cursor = params.get("cursor");
    if (cursor) {
      const doc = await db()
        .collection(path)
        .doc(
          z
            .string()
            .regex(/^[a-zA-Z0-9_-]{1,160}$/)
            .parse(cursor),
        )
        .get();
      if (doc.exists) query = query.startAfter(doc);
    }
    const snapshot = await query.limit(31).get();
    const records = snapshot.docs
      .slice(0, 30)
      .map((d) => ({ ...d.data(), id: d.id }));
    return Response.json({
      records,
      nextCursor: snapshot.size > 30 ? records.at(-1)?.id : null,
    });
  } catch (e) {
    return apiError(e);
  }
}
async function mutate(req: Request, ctx: Context) {
  try {
    await verifyMutation(req);
    const user = await authorize();
    const { collection: name } = await ctx.params;
    const path = collectionPath(name, user.uid);
    canMutate(name, user.role, req.method);
    const body = z
      .object({
        id: z
          .string()
          .regex(/^[a-zA-Z0-9_-]{1,160}$/)
          .optional(),
        data: z.unknown().optional(),
      })
      .parse(await req.json());
    const ref = body.id
      ? db().collection(path).doc(body.id)
      : db().collection(path).doc();
    const existing = body.id ? await ref.get() : null;
    if(body.id&&!existing?.exists) throw new APIError(404,'This record no longer exists. Refresh and try again.');
    if (req.method === "DELETE") {
      if (!body.id) throw new APIError(400, "Record ID is required.");
      if(name==='availability'&&existing?.data()?.appointmentId) throw new APIError(409,'Cancel the appointment before removing a booked slot.');
      if(name==='healthReports'||name==='prescriptions') {
        const storagePath=existing?.data()?.storagePath;
        if(typeof storagePath==='string'&&storagePath.startsWith(`users/${user.uid}/`)) await bucket().file(storagePath).delete({ignoreNotFound:true});
      }
      if(name==='conversations') await db().recursiveDelete(ref);
      else await ref.delete();
      return Response.json({ ok: true });
    }
    if (req.method === "PATCH" && !body.id)
      throw new APIError(400, "Record ID is required.");
    const schema = schemas[name as keyof typeof schemas];
    const data =
      name === "notifications"
        ? z.object({ read: z.boolean() }).strict().parse(body.data)
        : name==='feedback' && req.method==='PATCH' && user.role==='admin'
        ? z.object({status:z.enum(['received','reviewed','resolved'])}).strict().parse(body.data)
        : schema.parse(body.data);
    if(name==='availability') {
      if(existing?.data()?.appointmentId) throw new APIError(409,'Cancel the appointment before changing its slot.');
      const slot=data as {date:string;time:string};
      if(new Date(`${slot.date}T${slot.time}:00+05:30`).getTime()<=Date.now()) throw new APIError(400,'Choose a future date and time.');
    }
    if (name === "healthReports" || name === "prescriptions") {
      const storagePath = (data as { storagePath?: string }).storagePath;
      if (storagePath && !storagePath.startsWith(`users/${user.uid}/`))
        throw new APIError(403, "This file is not accessible.");
    }
    const now = new Date().toISOString();
    await ref.set(
      {
        ...data,
        updatedAt: now,
        ...(req.method === "POST" ? { createdAt: now } : {}),
        ...(name === "feedback" && req.method==='POST' ? { userId: user.uid } : {}),
      },
      { merge: req.method === "PATCH" },
    );
    return Response.json({ record: { ...data, id: ref.id, createdAt: now } });
  } catch (e) {
    return apiError(e);
  }
}
export const POST = mutate;
export const PATCH = mutate;
export const DELETE = mutate;
