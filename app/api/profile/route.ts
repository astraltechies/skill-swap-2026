import { apiError, ok, parseBody } from "@/lib/api";
import { earnedBadgeIds } from "@/lib/badges";
import { adminDb, requireUser } from "@/lib/firebase/admin";
import { profileUpdateSchema } from "@/lib/validation/schemas";
import { COLLECTIONS } from "@/types/firestore";

/**
 * Updates the parts of a profile the owner controls.
 *
 * Only the whitelisted fields are written — the request body cannot reach
 * coinBalance, role, status or anything else the server owns, even if a
 * crafted payload includes them.
 */
export async function PUT(request: Request) {
  try {
    const user = await requireUser();
    const input = await parseBody(request, profileUpdateSchema);

    const db = adminDb();
    const userRef = db.collection(COLLECTIONS.users).doc(user.uid);

    await userRef.update({
      displayName: input.displayName,
      bio: input.bio,
      city: input.city,
      skillsTeach: input.skillsTeach,
      skillsLearn: input.skillsLearn,
      availability: input.availability,
      // Kept in lockstep with skillsTeach so the browse/match queries can
      // filter in Firestore instead of over-fetching and filtering in memory.
      isTeaching: input.skillsTeach.length > 0,
      updatedAt: Date.now(),
    });

    // Teaching a third skill earns a badge, so re-check after the write.
    for (const badgeId of earnedBadgeIds({ ...user, skillsTeach: input.skillsTeach })) {
      await userRef
        .collection("badges")
        .doc(badgeId)
        .set({ badgeId, awardedAt: Date.now() }, { merge: true });
    }

    return ok();
  } catch (error) {
    return apiError(error);
  }
}
