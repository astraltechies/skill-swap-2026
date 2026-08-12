import { apiError, HandledError, ok, parseBody } from "@/lib/api";
import { earnedBadgeIds } from "@/lib/badges";
import { adminDb, requireConsentedUser } from "@/lib/firebase/admin";
import { ratingSchema } from "@/lib/validation/schemas";
import { COLLECTIONS, type Session, type UserProfile } from "@/types/firestore";

/**
 * Rates the other person after a completed session.
 *
 * The running average is recomputed inside the transaction from the stored
 * count rather than re-reading every rating, so this stays O(1) as a popular
 * teacher accumulates hundreds of reviews.
 */
export async function POST(request: Request) {
  try {
    const user = await requireConsentedUser();
    const input = await parseBody(request, ratingSchema);

    const db = adminDb();
    const sessionRef = db.collection(COLLECTIONS.sessions).doc(input.sessionId);

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(sessionRef);
      if (!snap.exists) throw new HandledError("That session no longer exists.", 404);

      const session = snap.data() as Session;

      if (session.teacherId !== user.uid && session.learnerId !== user.uid) {
        throw new HandledError("You weren't part of this session.", 403);
      }
      if (session.status !== "completed") {
        throw new HandledError("You can only rate a completed session.", 409);
      }

      // One rating per person per session — the id encodes that constraint.
      const ratingId = `${input.sessionId}_${user.uid}`;
      const ratingRef = db.collection(COLLECTIONS.ratings).doc(ratingId);
      if ((await tx.get(ratingRef)).exists) {
        throw new HandledError("You've already rated this session.", 409);
      }

      const ratedUserId =
        session.teacherId === user.uid ? session.learnerId : session.teacherId;
      const ratedRef = db.collection(COLLECTIONS.users).doc(ratedUserId);
      const ratedSnap = await tx.get(ratedRef);
      if (!ratedSnap.exists) throw new HandledError("That student no longer exists.", 404);

      const rated = ratedSnap.data() as UserProfile;
      const nextCount = rated.ratingCount + 1;
      const nextAvg = (rated.ratingAvg * rated.ratingCount + input.stars) / nextCount;
      const rounded = Math.round(nextAvg * 100) / 100;

      tx.create(ratingRef, {
        sessionId: input.sessionId,
        raterId: user.uid,
        ratedUserId,
        stars: input.stars,
        comment: input.comment,
        createdAt: Date.now(),
      });

      tx.update(ratedRef, { ratingAvg: rounded, ratingCount: nextCount });

      for (const badgeId of earnedBadgeIds({
        ...rated,
        ratingAvg: rounded,
        ratingCount: nextCount,
      })) {
        tx.set(
          ratedRef.collection("badges").doc(badgeId),
          { badgeId, awardedAt: Date.now() },
          { merge: true },
        );
      }
    });

    return ok();
  } catch (error) {
    return apiError(error);
  }
}
