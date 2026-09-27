import { cookies } from "next/headers";
import { z } from "zod";
import { adminAuth, db } from "@/lib/firebase/admin";
import { apiError, verifyMutation, APIError } from "@/lib/auth/server";
export async function POST(request: Request) {
  try {
    await verifyMutation(request);
    const { idToken } = z
      .object({ idToken: z.string().min(20).max(10000) })
      .parse(await request.json());
    const decoded = await adminAuth().verifyIdToken(idToken);
    if (Date.now() / 1000 - decoded.auth_time > 300)
      throw new APIError(401, "Please sign in again.");
    const expiresIn = 5 * 24 * 60 * 60 * 1000;
    const value = await adminAuth().createSessionCookie(idToken, { expiresIn });
    const ref = db().doc(`users/${decoded.uid}`);
    const current = await ref.get();
    await ref.set(
      {
        name:
          current.data()?.name ||
          decoded.name ||
          decoded.email?.split("@")[0] ||
          "Your profile",
        email: decoded.email || "",
        role: decoded.role || "user",
        updatedAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        ...(!current.exists ? { createdAt: new Date().toISOString() } : {}),
      },
      { merge: true },
    );
    (await cookies()).set("__session", value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: expiresIn / 1000,
    });
    return Response.json({ role: decoded.role || "user" });
  } catch (e) {
    return apiError(e);
  }
}
export async function DELETE(request: Request) {
  try {
    await verifyMutation(request);
    (await cookies()).delete("__session");
    return Response.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
