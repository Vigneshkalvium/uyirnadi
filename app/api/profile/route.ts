import { authorize, apiError, verifyMutation } from "@/lib/auth/server";
import { db } from "@/lib/firebase/admin";
import { profileSchema } from "@/lib/validation";
export async function GET() {
  try {
    const user = await authorize();
    return Response.json({
      profile: (await db().doc(`users/${user.uid}`).get()).data() || {
        name: user.name || "",
        email: user.email || "",
      },
    });
  } catch (e) {
    return apiError(e);
  }
}
export async function PUT(req: Request) {
  try {
    await verifyMutation(req);
    const user = await authorize();
    const data = profileSchema.parse(await req.json());
    await db()
      .doc(`users/${user.uid}`)
      .set(
        {
          ...data,
          email: user.email || data.email,
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
    return Response.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
