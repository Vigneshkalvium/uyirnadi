import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAppCheck } from "firebase-admin/app-check";
import { adminApp, adminAuth } from "@/lib/firebase/admin";
import type { Role } from "@/types";
export class APIError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function session() {
  const cookie = (await cookies()).get("__session")?.value;
  if (!cookie) throw new APIError(401, "Please sign in to continue.");
  try {
    return await adminAuth().verifySessionCookie(cookie, true);
  } catch {
    throw new APIError(401, "Your session has expired. Please sign in again.");
  }
}
export async function authorize(role?: Role) {
  const user = await session();
  if (role && user.role !== role)
    throw new APIError(403, "You do not have access to this resource.");
  return user;
}
export async function protectPage(role?: Role) {
  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) return;
  try {
    await authorize(role);
  } catch {
    redirect("/login");
  }
}
export async function verifyMutation(request: Request) {
  const origin = request.headers.get("origin");
  const expected = process.env.APP_URL || new URL(request.url).origin;
  if (origin !== new URL(expected).origin)
    throw new APIError(403, "Request origin was not accepted.");
  if (process.env.REQUIRE_APP_CHECK === "true") {
    const token = request.headers.get("X-Firebase-AppCheck");
    if (!token) throw new APIError(403, "App verification is required.");
    try {
      await getAppCheck(adminApp()).verifyToken(token);
    } catch {
      throw new APIError(403, "App verification failed.");
    }
  }
}
export function apiError(error: unknown) {
  if (error instanceof APIError)
    return Response.json({ error: error.message }, { status: error.status });
  if (error instanceof Error && error.name === "ZodError")
    return Response.json(
      { error: "Please check the information you entered." },
      { status: 400 },
    );
  return Response.json(
    { error: "The service could not complete this request. Please try again." },
    { status: 503 },
  );
}
