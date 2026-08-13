/**
 * Removes seeded demo accounts and the activity attached to them, leaving the
 * skill catalogue, the admins, and real sign-ups in place.
 *
 *   node --env-file=.env.local scripts/wipe-demo.mts --dry-run
 *   node --env-file=.env.local scripts/wipe-demo.mts --confirm
 *   node --env-file=.env.local scripts/wipe-demo.mts --confirm --everyone
 *
 * Defaults to demo accounts only — identified by their @demo.skillswap.test
 * address, which only the seed script issues — because real students signing up
 * is exactly what this platform is for, and their accounts should not disappear
 * as a side effect of clearing test data. `--everyone` opts into removing every
 * non-admin account instead.
 *
 * Refuses to run without --dry-run or --confirm, and prints exactly who it is
 * about to delete first. Anyone with `role: "admin"` is always kept.
 */

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

const DRY = process.argv.includes("--dry-run");
const CONFIRMED = process.argv.includes("--confirm");
const EVERYONE = process.argv.includes("--everyone");

/** Only the seed script hands out addresses on this domain. */
const DEMO_EMAIL_SUFFIX = "@demo.skillswap.test";

/** Kept in step with COINS.welcomeBonus in lib/constants.ts. */
const WELCOME_BONUS = 100;

if (!DRY && !CONFIRMED) {
  console.error(
    "\n  This deletes user accounts and cannot be undone.\n" +
      "  Run with --dry-run to preview, or --confirm to actually do it.\n",
  );
  process.exit(1);
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`\n  Missing ${name}. Run with: node --env-file=.env.local ...\n`);
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
const auth = getAuth();

/** Deletes a whole collection in chunks, so a large one can't blow the batch limit. */
async function deleteCollection(db: Firestore, path: string): Promise<number> {
  let removed = 0;
  for (;;) {
    const snap = await db.collection(path).limit(400).get();
    if (snap.empty) break;
    const batch = db.batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    removed += snap.size;
    if (snap.size < 400) break;
  }
  return removed;
}

async function deleteSubcollections(uid: string): Promise<void> {
  for (const sub of ["badges", "blocks", "notifications"]) {
    await deleteCollection(db, `users/${uid}/${sub}`);
  }
}

async function main() {
  console.log(DRY ? "\nDRY RUN — nothing will be deleted\n" : "\nDeleting demo data\n");

  const usersSnap = await db.collection("users").get();
  const keep: string[] = [];
  const remove: { uid: string; username: string; name: string }[] = [];
  let adminCount = 0;

  for (const doc of usersSnap.docs) {
    const data = doc.data();

    if (data.role === "admin") {
      adminCount++;
      keep.push(`@${data.username} (${data.displayName}) — admin`);
      continue;
    }

    // Ask Auth for the address rather than trusting anything in Firestore, so a
    // real student cannot be swept up by a profile field that happens to match.
    let isDemo = false;
    try {
      const record = await auth.getUser(doc.id);
      isDemo = (record.email ?? "").endsWith(DEMO_EMAIL_SUFFIX);
    } catch {
      // No Auth record left; treat as real and keep it unless --everyone.
    }

    if (EVERYONE || isDemo) {
      remove.push({ uid: doc.id, username: data.username, name: data.displayName });
    } else {
      keep.push(`@${data.username} (${data.displayName}) — real sign-up`);
    }
  }

  console.log(EVERYONE ? "KEEPING (admins only):" : "KEEPING:");
  keep.forEach((k) => console.log("  " + k));
  if (adminCount === 0) {
    console.error(
      "\n  No admin found. Refusing to run and risk locking you out.\n" +
        "  Promote someone first: node --env-file=.env.local scripts/make-admin.mts <username>\n",
    );
    process.exit(1);
  }

  if (remove.length === 0) {
    console.log("\nNothing to delete.\n");
    return;
  }

  console.log(
    `\nDELETING ${remove.length} ${EVERYONE ? "non-admin" : "demo"} account${remove.length === 1 ? "" : "s"}:`,
  );
  remove.forEach((r) => console.log(`  @${r.username} (${r.name})`));

  console.log("\nAlso clearing: sessions, chat threads, ratings, coin transactions,");
  console.log("matches, reports, consent records, AI usage logs.");
  console.log("Keeping: skill catalogue, categories, badge definitions, and everyone listed above.");

  if (DRY) {
    console.log("\nDry run complete. Re-run with --confirm to apply.\n");
    return;
  }

  // Activity collections first, so nothing is left pointing at a deleted user.
  for (const path of [
    "sessions",
    "ratings",
    "coinTransactions",
    "matches",
    "reports",
    "consentRecords",
    "aiUsageLogs",
    "rateLimits",
    "adminActions",
  ]) {
    const n = await deleteCollection(db, path);
    console.log(`  cleared ${path}: ${n}`);
  }

  // Chat threads carry a messages subcollection that has to go first.
  const threads = await db.collection("chatThreads").get();
  for (const thread of threads.docs) {
    await deleteCollection(db, `chatThreads/${thread.id}/messages`);
    await thread.ref.delete();
  }
  console.log(`  cleared chatThreads: ${threads.size}`);

  for (const user of remove) {
    await deleteSubcollections(user.uid);
    await db.collection("users").doc(user.uid).delete();
    await db.collection("usernames").doc(user.username).delete();
    try {
      await auth.deleteUser(user.uid);
    } catch {
      // Already gone from Auth — the Firestore side is what matters here.
    }
  }
  console.log(`  deleted ${remove.length} accounts`);

  /*
   * Everyone still here keeps their login, profile and skills — but their
   * activity is reset, because the ledger rows explaining their balance were
   * just deleted along with everyone else's. Leaving a balance with no ledger
   * behind it would be the one inconsistency this whole model is built to
   * prevent, so each kept account starts again from a fresh welcome bonus.
   */
  const survivors = await db.collection("users").get();
  const now = Date.now();

  for (const doc of survivors.docs) {
    await doc.ref.update({
      coinBalance: WELCOME_BONUS,
      ratingAvg: 0,
      ratingCount: 0,
      sessionsTaught: 0,
      sessionsLearned: 0,
      reportCount: 0,
      status: "active",
      updatedAt: now,
    });

    await deleteCollection(db, `users/${doc.id}/badges`);
    await deleteCollection(db, `users/${doc.id}/blocks`);
    await deleteCollection(db, `users/${doc.id}/notifications`);

    await db.collection("coinTransactions").add({
      userId: doc.id,
      amount: WELCOME_BONUS,
      type: "welcome_bonus",
      description: "Welcome to Skill Swap",
      relatedSessionId: null,
      balanceAfter: WELCOME_BONUS,
      createdAt: now,
    });
  }
  console.log(`  reset ${survivors.size} remaining account(s) to a clean slate`);

  // Teacher counts were denormalised from accounts that may have just gone.
  const skills = await db.collection("skills").get();
  const counts = new Map<string, number>();
  survivors.docs.forEach((d) => {
    const teach = (d.data().skillsTeach ?? []) as { skillId: string }[];
    teach.forEach((s) => counts.set(s.skillId, (counts.get(s.skillId) ?? 0) + 1));
  });
  const batch = db.batch();
  skills.docs.forEach((d) => batch.update(d.ref, { teacherCount: counts.get(d.id) ?? 0 }));
  await batch.commit();
  console.log(`  recounted teachers on ${skills.size} skills`);

  console.log("\nDone. Catalogue, logins and profiles intact; activity reset.\n");
}

main().catch((error) => {
  console.error("\nWipe failed:", error);
  process.exit(1);
});
