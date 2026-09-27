import { z } from "zod";
import { adminAuth, db } from "@/lib/firebase/admin";
import {
  authorize,
  verifyMutation,
  apiError,
  APIError,
} from "@/lib/auth/server";
import { createAccountSchema } from "@/lib/validation/accounts";

export async function POST(request: Request) {
  try {
    await verifyMutation(request);
    await authorize("admin");
    const data = createAccountSchema.parse(await request.json());
    let uid: string;
    try {
      const user = await adminAuth().createUser({
        email: data.email,
        password: data.password,
        displayName: data.name,
        emailVerified: false,
      });
      uid = user.uid;
    } catch (error) {
      if ((error as { code?: string }).code === "auth/email-already-exists")
        throw new APIError(409, "An account with this email already exists.");
      throw error;
    }
    try {
      await adminAuth().setCustomUserClaims(uid, { role: data.role });
      const now = new Date().toISOString();
      const batch = db().batch();
      batch.create(db().doc(`users/${uid}`), {
        name: data.name,
        email: data.email,
        phone: data.phone || "",
        role: data.role,
        createdAt: now,
        updatedAt: now,
      });
      if (data.role === "doctor")
        batch.create(db().doc(`doctors/${uid}`), {
          name: data.name,
          specialization: data.specialization,
          qualification: data.qualification || "Pending verification",
          experience: 0,
          fee: 0,
          description: "",
          active: false,
          createdAt: now,
          updatedAt: now,
        });
      await batch.commit();
    } catch (error) {
      await adminAuth().deleteUser(uid);
      throw error;
    }
    return Response.json({ id: uid }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    await verifyMutation(request);
    const actor = await authorize("admin");
    const { id, disabled } = z
      .object({ id: z.string().regex(/^[\w-]{1,128}$/), disabled: z.boolean() })
      .strict()
      .parse(await request.json());
    if (id === actor.uid)
      throw new APIError(400, "You cannot disable your own account.");
    await adminAuth().updateUser(id, { disabled });
    if (disabled) await adminAuth().revokeRefreshTokens(id);
    await db()
      .doc(`users/${id}`)
      .update({ disabled, updatedAt: new Date().toISOString() });
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
