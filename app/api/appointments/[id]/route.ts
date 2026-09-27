import { z } from "zod";
import {
  authorize,
  apiError,
  verifyMutation,
  APIError,
} from "@/lib/auth/server";
import { db } from "@/lib/firebase/admin";
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await verifyMutation(req);
    const user = await authorize();
    const { id } = await params;
    z.string()
      .regex(/^[a-zA-Z0-9_-]{1,160}$/)
      .parse(id);
    const { status } = z
      .object({ status: z.enum(["confirmed", "completed", "cancelled"]) })
      .parse(await req.json());
    const ref = db().doc(`appointments/${id}`);
    await db().runTransaction(async (tx) => {
      const appointment = await tx.get(ref);
      if (!appointment.exists)
        throw new APIError(404, "Appointment not found.");
      const a = appointment.data()!;
      const manager =
        user.role === "admin" ||
        (user.role === "doctor" && a.doctorId === user.uid);
      if (!manager && (a.userId !== user.uid || status !== "cancelled"))
        throw new APIError(403, "You cannot update this appointment.");
      if (["cancelled", "completed"].includes(a.status))
        throw new APIError(409, "This appointment is already closed.");
      if (status === "completed" && a.status !== "confirmed")
        throw new APIError(409, "Confirm this appointment first.");
      const now = new Date().toISOString();
      tx.update(ref, { status, updatedAt: now });
      if (status === "cancelled")
        tx.update(db().doc(`doctors/${a.doctorId}/availability/${a.slotId}`), {
          appointmentId: null,
          updatedAt: now,
        });
      tx.create(db().collection(`users/${a.userId}/notifications`).doc(), {
        title: `Appointment ${status}`,
        message: `Your appointment with ${a.doctorName} was ${status}.`,
        read: false,
        type: "appointment",
        createdAt: now,
        updatedAt: now,
      });
    });
    return Response.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
