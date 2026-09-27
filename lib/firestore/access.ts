import "server-only";
import { APIError } from "@/lib/auth/server";
import { schemas } from "@/lib/validation";
export const globalCollections = [
  "doctors",
  "appointments",
  "healthTips",
  "emergencyContacts",
  "feedback",
  "users",
];
export function collectionPath(name: string, uid: string) {
  if (!(name in schemas) && !["appointments", "users"].includes(name))
    throw new APIError(404, "Collection not found.");
  if (name === "availability") return `doctors/${uid}/availability`;
  return globalCollections.includes(name) ? name : `users/${uid}/${name}`;
}
export function canMutate(name: string, role: unknown, method: string) {
  if (["medicines", "medicineLogs"].includes(name)) throw new APIError(410,"Medicine reminders have been removed.");
  if (["users", "appointments"].includes(name))
    throw new APIError(403, "Use the dedicated management operation.");
  if (
    ["doctors", "healthTips", "emergencyContacts"].includes(name) &&
    role !== "admin"
  )
    throw new APIError(403, "Administrator access is required.");
  if (name === "availability" && role !== "doctor")
    throw new APIError(403, "Doctor access is required.");
  if (name === "feedback" && method !== "POST" && role !== "admin")
    throw new APIError(403, "Administrator access is required.");
  if (name === "notifications" && method !== "PATCH")
    throw new APIError(403, "Notifications are managed by the system.");
}
