import { adminAuth, db } from "@/lib/firebase/admin";

const [uid, role] = process.argv.slice(2);
if (!uid || !["user", "doctor", "admin"].includes(role)) {
  throw new Error(
    "Usage: npm run set-role -- <Firebase UID> <user|doctor|admin>",
  );
}

await adminAuth().setCustomUserClaims(uid, { role });
await db()
  .doc(`users/${uid}`)
  .set({ role, updatedAt: new Date().toISOString() }, { merge: true });
console.log(
  `Role '${role}' assigned to ${uid}. The user must sign in again to refresh claims.`,
);
