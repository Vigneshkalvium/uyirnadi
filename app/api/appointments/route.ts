import {
  authorize,
  apiError,
  verifyMutation,
  APIError,
} from "@/lib/auth/server";
import { db } from "@/lib/firebase/admin";
import { appointmentSchema } from "@/lib/validation";
export async function POST(req: Request) {
  try {
    await verifyMutation(req);
    const user = await authorize();
    const input = appointmentSchema.parse(await req.json());
    const slotRef = db().doc(
      `doctors/${input.doctorId}/availability/${input.slotId}`,
    );
    const doctorRef = db().doc(`doctors/${input.doctorId}`);
    const apptRef = db().collection("appointments").doc();
    const now = new Date().toISOString();
    await db().runTransaction(async (tx) => {
      const [slot, doctor, profile] = await Promise.all([
        tx.get(slotRef),
        tx.get(doctorRef),
        tx.get(db().doc(`users/${user.uid}`)),
      ]);
      if (!doctor.exists || !doctor.data()?.active)
        throw new APIError(404, "Doctor is unavailable.");
      if (!slot.exists || slot.data()?.blocked || slot.data()?.appointmentId)
        throw new APIError(
          409,
          "This appointment slot is no longer available. Please choose another.",
        );
      const s = slot.data()!;
      if (new Date(`${s.date}T${s.time}:00+05:30`).getTime() <= Date.now())
        throw new APIError(400, "Please choose a future appointment.");
      tx.create(apptRef, {
        userId: user.uid,
        patientName: profile.data()?.name || "Patient",
        doctorId: input.doctorId,
        doctorName: doctor.data()!.name,
        specialization: doctor.data()!.specialization,
        date: s.date,
        time: s.time,
        slotId: input.slotId,
        reason: input.reason,
        status: "pending",
        createdAt: now,
        updatedAt: now,
      });
      tx.update(slotRef, { appointmentId: apptRef.id, updatedAt: now });
      tx.create(db().collection(`users/${user.uid}/notifications`).doc(), {
        title: "Appointment requested",
        message: `Your appointment with ${doctor.data()!.name} is awaiting confirmation.`,
        type: "appointment",
        read: false,
        createdAt: now,
        updatedAt: now,
      });
    });
    return Response.json({ id: apptRef.id });
  } catch (e) {
    return apiError(e);
  }
}
