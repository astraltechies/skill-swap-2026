import { apiError, HandledError, ok, parseBody } from "@/lib/api";
import { earnedBadgeIds } from "@/lib/badges";
import { applyCoinDelta } from "@/lib/coins/ledger";
import { minimumElapsedMs, SESSION_COMPLETE_WINDOW_MS } from "@/lib/constants";
import { adminDb, requireConsentedUser } from "@/lib/firebase/admin";
import { COLLECTIONS, type Session, type UserProfile } from "@/types/firestore";
import { z } from "zod";

const bodySchema = z.object({ sessionId: z.string().min(1) });

/**
 * Records one person's confirmation that a session happened, and moves the
 * coins once both have confirmed.
 *
 * Two rules keep this from being a free coin button:
 *
 * 1. Both people must confirm. A teacher alone cannot mark their own session
 *    complete and pay themselves — the learner has to agree it happened.
 * 2. Most of the booked time has to have actually passed. Otherwise a pair
 *    could book an hour, join, leave after a minute, and both confirm.
 *
 * The transfer itself still happens in one transaction guarded by `settledAt`,
 * so a double tap or a retry after a dropped connection cannot pay twice.
 */
export async function POST(request: Request) {
  try {
    const user = await requireConsentedUser();
    const { sessionId } = await parseBody(request, bodySchema);

    const db = adminDb();
    const sessionRef = db.collection(COLLECTIONS.sessions).doc(sessionId);

    const result = await db.runTransaction(async (tx) => {
      const snap = await tx.get(sessionRef);
      if (!snap.exists) throw new HandledError("That session no longer exists.", 404);

      const session = { ...snap.data(), id: snap.id } as Session;

      const isTeacher = session.teacherId === user.uid;
      const isLearner = session.learnerId === user.uid;

      if (!isTeacher && !isLearner) {
        throw new HandledError("You weren't part of this session.", 403);
      }
      if (session.status !== "accepted") {
        throw new HandledError("Only a confirmed session can be completed.", 409);
      }
      if (session.settledAt !== null) {
        throw new HandledError("This session has already been completed.", 409);
      }

      const now = Date.now();
      const required = minimumElapsedMs(session.durationMins);

      if (now < session.scheduledAt + required) {
        const minutesLeft = Math.ceil((session.scheduledAt + required - now) / 60000);
        throw new HandledError(
          `Too early. A ${session.durationMins}-minute session can be confirmed after ${Math.round(required / 60000)} minutes — about ${minutesLeft} more to go.`,
          409,
        );
      }
      if (now > session.scheduledAt + SESSION_COMPLETE_WINDOW_MS) {
        throw new HandledError(
          "This session is too old to complete. Ask an admin if it needs sorting out.",
          409,
        );
      }

      // Record this person's confirmation, then see whether that completes the pair.
      const teacherConfirmedAt = isTeacher
        ? (session.teacherConfirmedAt ?? now)
        : session.teacherConfirmedAt;
      const learnerConfirmedAt = isLearner
        ? (session.learnerConfirmedAt ?? now)
        : session.learnerConfirmedAt;

      if (teacherConfirmedAt === null || learnerConfirmedAt === null) {
        tx.update(sessionRef, { teacherConfirmedAt, learnerConfirmedAt, updatedAt: now });
        return {
          settled: false,
          waitingOn: teacherConfirmedAt === null ? "teacher" : "learner",
        } as const;
      }

      const teacherRef = db.collection(COLLECTIONS.users).doc(session.teacherId);
      const learnerRef = db.collection(COLLECTIONS.users).doc(session.learnerId);
      const [teacherSnap, learnerSnap] = await Promise.all([
        tx.get(teacherRef),
        tx.get(learnerRef),
      ]);

      if (!teacherSnap.exists || !learnerSnap.exists) {
        throw new HandledError("One of the students no longer has an account.", 409);
      }

      const teacher = teacherSnap.data() as UserProfile;
      const learner = learnerSnap.data() as UserProfile;

      if (learner.coinBalance < session.coinAmount) {
        throw new HandledError(
          "The learner doesn't have enough SkillCoins to settle this session.",
          402,
        );
      }

      applyCoinDelta(tx, {
        userId: learner.uid,
        currentBalance: learner.coinBalance,
        amount: -session.coinAmount,
        type: "session_spent",
        description: "Session with a peer",
        relatedSessionId: session.id,
      });

      applyCoinDelta(tx, {
        userId: teacher.uid,
        currentBalance: teacher.coinBalance,
        amount: session.coinAmount,
        type: "session_earned",
        description: "Taught a session",
        relatedSessionId: session.id,
      });

      const teacherTaught = teacher.sessionsTaught + 1;
      const learnerLearned = learner.sessionsLearned + 1;

      tx.update(teacherRef, { sessionsTaught: teacherTaught });
      tx.update(learnerRef, { sessionsLearned: learnerLearned });

      tx.update(sessionRef, {
        status: "completed",
        teacherConfirmedAt,
        learnerConfirmedAt,
        settledAt: now,
        updatedAt: now,
      });

      // Badges are written as subcollection docs, so `create` on an existing id
      // is a no-op conflict rather than a duplicate award.
      const newTeacherBadges = earnedBadgeIds({
        ...teacher,
        sessionsTaught: teacherTaught,
      });
      const newLearnerBadges = earnedBadgeIds({
        ...learner,
        sessionsLearned: learnerLearned,
      });

      for (const badgeId of newTeacherBadges) {
        tx.set(
          teacherRef.collection("badges").doc(badgeId),
          { badgeId, awardedAt: now },
          { merge: true },
        );
      }
      for (const badgeId of newLearnerBadges) {
        tx.set(
          learnerRef.collection("badges").doc(badgeId),
          { badgeId, awardedAt: now },
          { merge: true },
        );
      }

      return {
        settled: true,
        earned: isTeacher ? session.coinAmount : -session.coinAmount,
      } as const;
    });

    return ok(result);
  } catch (error) {
    return apiError(error);
  }
}
