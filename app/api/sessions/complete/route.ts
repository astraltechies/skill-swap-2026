import { apiError, HandledError, ok, parseBody } from "@/lib/api";
import { earnedBadgeIds } from "@/lib/badges";
import { applyCoinDelta } from "@/lib/coins/ledger";
import { SESSION_COMPLETE_WINDOW_MS } from "@/lib/constants";
import { adminDb, requireConsentedUser } from "@/lib/firebase/admin";
import { COLLECTIONS, type Session, type UserProfile } from "@/types/firestore";
import { z } from "zod";

const bodySchema = z.object({ sessionId: z.string().min(1) });

/**
 * Marks a session complete and moves the coins.
 *
 * Everything happens inside one transaction, and `settledAt` is both checked
 * and written inside it. Two taps on the Complete button, or a retry after a
 * dropped connection, cannot pay the teacher twice — the second attempt reads
 * a non-null `settledAt` and stops.
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

      if (session.teacherId !== user.uid && session.learnerId !== user.uid) {
        throw new HandledError("You weren't part of this session.", 403);
      }
      if (session.status !== "accepted") {
        throw new HandledError("Only a confirmed session can be completed.", 409);
      }
      if (session.settledAt !== null) {
        throw new HandledError("This session has already been completed.", 409);
      }
      if (Date.now() < session.scheduledAt) {
        throw new HandledError("You can mark this complete once it has started.", 409);
      }
      if (Date.now() > session.scheduledAt + SESSION_COMPLETE_WINDOW_MS) {
        throw new HandledError(
          "This session is too old to complete. Ask an admin if it needs sorting out.",
          409,
        );
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

      const now = Date.now();

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
        earned: session.teacherId === user.uid ? session.coinAmount : -session.coinAmount,
      };
    });

    return ok(result);
  } catch (error) {
    return apiError(error);
  }
}
