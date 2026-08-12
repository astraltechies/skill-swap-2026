/**
 * One-off migrations for documents written before a field existed.
 *
 *   node --env-file=.env.local scripts/backfill.mts
 *
 * Safe to re-run: every step only writes where the field is actually missing
 * or wrong, and reports how many documents it touched.
 */

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`\n  Missing ${name}. Run with: node --env-file=.env.local scripts/backfill.mts\n`);
    process.exit(1);
  }
  return value;
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

/**
 * `isTeaching` mirrors `skillsTeach.length > 0`. It exists because Firestore
 * cannot query for a non-empty array, and the browse/match queries now filter
 * on it — so any user document without it is invisible to those queries.
 */
async function backfillIsTeaching() {
  const snap = await db.collection("users").get();
  let fixed = 0;
  let batch = db.batch();
  let pending = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    const expected = Array.isArray(data.skillsTeach) && data.skillsTeach.length > 0;
    if (data.isTeaching === expected) continue;

    batch.update(doc.ref, { isTeaching: expected });
    fixed++;
    if (++pending >= 400) {
      await batch.commit();
      batch = db.batch();
      pending = 0;
    }
  }

  if (pending > 0) await batch.commit();
  console.log(`  isTeaching: ${fixed} of ${snap.size} user documents updated`);
}

async function main() {
  console.log("\nBackfilling\n");
  await backfillIsTeaching();
  console.log("\nDone.\n");
}

main().catch((error) => {
  console.error("\nBackfill failed:", error);
  process.exit(1);
});
