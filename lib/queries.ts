import "server-only";

import { adminDb, isAdminConfigured } from "@/lib/firebase/admin";
import {
  COLLECTIONS,
  type ChatThread,
  type CoinTransaction,
  type Notification,
  type Rating,
  type Session,
  type Skill,
  type SkillCategory,
  type UserProfile,
} from "@/types/firestore";
import { cache } from "react";

/**
 * `cache()` dedupes within a single request — a page that renders three
 * components all needing the skill catalogue reads Firestore once.
 */

/**
 * The skill catalogue and categories are reference data: they change when an
 * admin edits them, which is roughly never, yet every dynamic page was
 * re-reading all 33 skill documents on every single request. React's `cache()`
 * only dedupes *within* one request, so it never helped here.
 *
 * This holds the result on the server instance for a few minutes. Worst case
 * after an admin edit is a short window where some instances still serve the
 * previous catalogue, which is an acceptable trade for removing two Firestore
 * round-trips from every page load.
 */
const REFERENCE_TTL_MS = 5 * 60 * 1000;

function withTtl<T>(load: () => Promise<T>): () => Promise<T> {
  let value: T | null = null;
  let loadedAt = 0;
  let inflight: Promise<T> | null = null;

  return async () => {
    if (value !== null && Date.now() - loadedAt < REFERENCE_TTL_MS) return value;
    // Share one request across concurrent callers instead of stampeding.
    inflight ??= load()
      .then((result) => {
        value = result;
        loadedAt = Date.now();
        return result;
      })
      .finally(() => {
        inflight = null;
      });
    return inflight;
  };
}

export const getSkills = withTtl(async (): Promise<Skill[]> => {
  if (!isAdminConfigured) return [];
  const snap = await adminDb().collection(COLLECTIONS.skills).get();
  return snap.docs.map((d) => ({ ...d.data(), id: d.id }) as Skill);
});

export const getSkillsMap = cache(async (): Promise<Map<string, Skill>> => {
  const skills = await getSkills();
  return new Map(skills.map((s) => [s.id, s]));
});

export const getCategories = withTtl(async (): Promise<SkillCategory[]> => {
  if (!isAdminConfigured) return [];
  const snap = await adminDb().collection(COLLECTIONS.skillCategories).orderBy("order").get();
  return snap.docs.map((d) => ({ ...d.data(), id: d.id }) as SkillCategory);
});

export const getUserByUsername = cache(
  async (username: string): Promise<UserProfile | null> => {
    if (!isAdminConfigured) return null;
    const snap = await adminDb()
      .collection(COLLECTIONS.users)
      .where("username", "==", username.toLowerCase())
      .limit(1)
      .get();
    if (snap.empty) return null;
    const profile = snap.docs[0].data() as UserProfile;
    // A banned profile is gone from the public site entirely.
    return profile.status === "banned" ? null : profile;
  },
);

export const getUserById = cache(async (uid: string): Promise<UserProfile | null> => {
  if (!isAdminConfigured) return null;
  const snap = await adminDb().collection(COLLECTIONS.users).doc(uid).get();
  return snap.exists ? (snap.data() as UserProfile) : null;
});

/**
 * Bulk-loads profiles for a list of ids, skipping missing ones.
 *
 * Banned accounts are hidden by default, because everywhere a student sees
 * other people they should be gone. The moderation queue passes
 * `includeBanned` — without it a banned account cannot be loaded, so the one
 * screen that needs to offer "reinstate" was the one screen that could never
 * show it.
 */
export const getUsersByIds = cache(
  async (uids: string[], includeBanned = false): Promise<Map<string, UserProfile>> => {
    const unique = [...new Set(uids)].filter(Boolean);
    if (!isAdminConfigured || unique.length === 0) return new Map();

    const db = adminDb();
    // getAll has no documented cap, but chunking keeps a large fan-out safe.
    const chunks: string[][] = [];
    for (let i = 0; i < unique.length; i += 100) chunks.push(unique.slice(i, i + 100));

    const results = await Promise.all(
      chunks.map((chunk) =>
        db.getAll(...chunk.map((uid) => db.collection(COLLECTIONS.users).doc(uid))),
      ),
    );

    const map = new Map<string, UserProfile>();
    for (const snap of results.flat()) {
      if (!snap.exists) continue;
      const profile = snap.data() as UserProfile;
      if (!includeBanned && profile.status === "banned") continue;
      map.set(profile.uid, profile);
    }
    return map;
  },
);

/**
 * Active students who teach at least one thing — the browse and match pool.
 *
 * Filters on `isTeaching` in Firestore rather than pulling everyone and
 * filtering here. The old version applied `limit` *before* the in-memory
 * filter and had no `orderBy`, so past 200 users it silently served whichever
 * 200 document IDs sorted first alphabetically — the same ones forever.
 */
export const getTeachingUsers = cache(async (limit = 120): Promise<UserProfile[]> => {
  if (!isAdminConfigured) return [];
  const snap = await adminDb()
    .collection(COLLECTIONS.users)
    .where("status", "==", "active")
    .where("isTeaching", "==", true)
    .orderBy("updatedAt", "desc")
    .limit(limit)
    .get();
  return snap.docs.map((d) => d.data() as UserProfile);
});

/**
 * Top teachers, ranked in Firestore. The leaderboard used to reuse the browse
 * pool and sort 200 documents in memory to show 50.
 */
export const getTopTeachers = cache(async (limit = 50): Promise<UserProfile[]> => {
  if (!isAdminConfigured) return [];
  const snap = await adminDb()
    .collection(COLLECTIONS.users)
    .where("status", "==", "active")
    .orderBy("sessionsTaught", "desc")
    .limit(limit)
    .get();
  return snap.docs
    .map((d) => d.data() as UserProfile)
    .filter((u) => u.sessionsTaught > 0);
});

/**
 * Recent sessions for a user. Bounded and ordered in Firestore — this used to
 * read a user's entire history, in both directions, so the dashboard could
 * display three rows.
 */
export const getSessionsForUser = cache(
  async (uid: string, limit = 60): Promise<Session[]> => {
    if (!isAdminConfigured) return [];
    const db = adminDb();
    const [asTeacher, asLearner] = await Promise.all([
      db
        .collection(COLLECTIONS.sessions)
        .where("teacherId", "==", uid)
        .orderBy("scheduledAt", "desc")
        .limit(limit)
        .get(),
      db
        .collection(COLLECTIONS.sessions)
        .where("learnerId", "==", uid)
        .orderBy("scheduledAt", "desc")
        .limit(limit)
        .get(),
    ]);

    const seen = new Map<string, Session>();
    for (const doc of [...asTeacher.docs, ...asLearner.docs]) {
      seen.set(doc.id, { ...doc.data(), id: doc.id } as Session);
    }
    return [...seen.values()].sort((a, b) => b.scheduledAt - a.scheduledAt);
  },
);

export const getSessionById = cache(async (sessionId: string): Promise<Session | null> => {
  if (!isAdminConfigured) return null;
  const snap = await adminDb().collection(COLLECTIONS.sessions).doc(sessionId).get();
  return snap.exists ? ({ ...snap.data(), id: snap.id } as Session) : null;
});

export const getChatThreads = cache(async (uid: string): Promise<ChatThread[]> => {
  if (!isAdminConfigured) return [];
  const snap = await adminDb()
    .collection(COLLECTIONS.chatThreads)
    .where("participantIds", "array-contains", uid)
    .orderBy("lastMessageAt", "desc")
    .limit(50)
    .get();
  return snap.docs.map((d) => ({ ...d.data(), id: d.id }) as ChatThread);
});

export const getCoinTransactions = cache(
  async (uid: string, limit = 50): Promise<CoinTransaction[]> => {
    if (!isAdminConfigured) return [];
    const snap = await adminDb()
      .collection(COLLECTIONS.coinTransactions)
      .where("userId", "==", uid)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();
    return snap.docs.map((d) => ({ ...d.data(), id: d.id }) as CoinTransaction);
  },
);

export const getRatingsFor = cache(async (uid: string, limit = 10): Promise<Rating[]> => {
  if (!isAdminConfigured) return [];
  const snap = await adminDb()
    .collection(COLLECTIONS.ratings)
    .where("ratedUserId", "==", uid)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();
  return snap.docs.map((d) => ({ ...d.data(), id: d.id }) as Rating);
});

export const getAwardedBadges = cache(async (uid: string): Promise<string[]> => {
  if (!isAdminConfigured) return [];
  const snap = await adminDb()
    .collection(COLLECTIONS.users)
    .doc(uid)
    .collection("badges")
    .get();
  return snap.docs.map((d) => d.id);
});

export const getBlockedIds = cache(async (uid: string): Promise<Set<string>> => {
  if (!isAdminConfigured) return new Set();
  const snap = await adminDb()
    .collection(COLLECTIONS.users)
    .doc(uid)
    .collection("blocks")
    .get();
  return new Set(snap.docs.map((d) => d.id));
});

export const getNotifications = cache(
  async (uid: string, limit = 30): Promise<Notification[]> => {
    if (!isAdminConfigured) return [];
    const snap = await adminDb()
      .collection(COLLECTIONS.users)
      .doc(uid)
      .collection("notifications")
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();
    return snap.docs.map((d) => ({ ...d.data(), id: d.id }) as Notification);
  },
);

/**
 * Counts unread notifications for the badge.
 *
 * Capped at 20 because the badge renders "9+" past nine — reading the whole
 * backlog to render a number that stops counting would be paying for precision
 * nobody sees.
 */
export const getUnreadCount = cache(async (uid: string): Promise<number> => {
  if (!isAdminConfigured) return 0;
  const snap = await adminDb()
    .collection(COLLECTIONS.users)
    .doc(uid)
    .collection("notifications")
    .where("read", "==", false)
    .limit(20)
    .get();
  return snap.size;
});
