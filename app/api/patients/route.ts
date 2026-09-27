import { authorize, apiError, APIError } from "@/lib/auth/server";
import { db } from "@/lib/firebase/admin";
export async function GET(req: Request) {
  try {
    const doctor = await authorize("doctor");
    const uid = new URL(req.url).searchParams.get("userId");
    if (!uid || !/^[-\w]{1,128}$/.test(uid))
      throw new APIError(400, "Select a patient.");
    const appts = await db()
      .collection("appointments")
      .where("doctorId", "==", doctor.uid)
      .where("userId", "==", uid)
      .where("status", "in", ["confirmed", "completed"])
      .limit(1)
      .get();
    if (appts.empty)
      throw new APIError(403, "No authorized patient relationship.");
    const reports = await db()
      .collection(`users/${uid}/healthReports`)
      .where("sharedWith", "array-contains", doctor.uid)
      .limit(30)
      .get();
    return Response.json({
      records: reports.docs.map((d) => ({ ...d.data(), id: d.id })),
    });
  } catch (e) {
    return apiError(e);
  }
}
