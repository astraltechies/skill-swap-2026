/**
 * Promotes a student to admin, or demotes them back.
 *
 *   node --env-file=.env.local scripts/make-admin.mts <username>
 *   node --env-file=.env.local scripts/make-admin.mts <username> --remove
 *
 * There is deliberately no button for this in the app. An account that can ban
 * other students should only ever be created by someone with the project's
 * service-account key, not by anything reachable over the network.
 */

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(
      `\n  Missing ${name}. Run with: node --env-file=.env.local scripts/make-admin.mts <username>\n`,
    );
    process.exit(1);
  }
  return value;
}

const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const remove = process.argv.includes("--remove");
const username = args[0]?.toLowerCase();

if (!username) {
  console.error("\n  Usage: node --env-file=.env.local scripts/make-admin.mts <username> [--remove]\n");
  process.exit(1);
}

if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: requireEnv("FIREBASE_ADMIN_PROJECT_ID"),
      clientEmail: requireEnv("FIREBASE_ADMIN_CLIENT_EMAIL"),
      privateKey: requireEnv("FIREBASE_ADMIN_PRIVATE_KEY").replace(/\\n/g, "\n"),
    }),
  });
}

const db = getFirestore();

async function main() {
  const snap = await db
    .collection("users")
    .where("username", "==", username)
    .limit(1)
    .get();

  if (snap.empty) {
    console.error(`\n  No user with username "${username}".\n`);
    process.exit(1);
  }

  const doc = snap.docs[0];
  const role = remove ? "student" : "admin";
  await doc.ref.update({ role, updatedAt: Date.now() });

  // Logged like any other privileged action, so the audit trail shows how an
  // admin came to exist rather than them just appearing.
  await db.collection("adminActions").add({
    adminId: "script:make-admin",
    actionType: remove ? "demote_admin" : "promote_admin",
    targetId: doc.id,
    notes: `Role set to ${role} via scripts/make-admin.mts`,
    createdAt: Date.now(),
  });

  const data = doc.data();
  console.log(`\n  ${data.displayName} (@${username}) is now a ${role}.\n`);
  if (!remove) console.log("  They'll see an Admin link in the sidebar after signing in again.\n");
}

main().catch((error) => {
  console.error("\nFailed:", error);
  process.exit(1);
});
