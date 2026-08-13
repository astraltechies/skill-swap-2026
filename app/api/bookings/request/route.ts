import { apiError, HandledError, ok, parseBody } from "@/lib/api";
import { COINS } from "@/lib/constants";
import { adminDb, requireConsentedUser } from "@/lib/firebase/admin";
import { roomIdFor } from "@/lib/sessions/room";
import { bookingRequestSchema } from "@/lib/validation/schemas";
import { COLLECTIONS, type Session, type UserProfile } from "@/types/firestore";

/**
 * Requests a session. Coins are checked here but not moved — they transfer only
 * when the session is actually completed, so a declined or cancelled request
 * never costs the learner anything.
 */
export async function POST(request: Request) {
  try {
    const learner = await requireConsentedUser();
    const input = await parseBody(request, bookingRequestSchema);

    if (input.teacherId === learner.uid) {
      throw new HandledError("You can't book a session with yourself.", 400);
    }

    const db = adminDb();

    const [teacherSnap, blockedByMe, blockedByThem] = await Promise.all([
      db.collection(COLLECTIONS.users).doc(input.teacherId).get(),
      db.collection(COLLECTIONS.users).doc(learner.uid).collection("blocks").doc(input.teacherId).get(),
      db.collection(COLLECTIONS.users).doc(input.teacherId).collection("blocks").doc(learner.uid).get(),
    ]);

    if (!teacherSnap.exists) throw new HandledError("That student no longer exists.", 404);

    const teacher = teacherSnap.data() as UserProfile;
    if (teacher.status !== "active") {
      throw new HandledError("That student isn't taking sessions right now.", 409);
    }

    // Blocking hides the person entirely rather than showing an error that
    // confirms they blocked you.
    if (blockedByMe.exists || blockedByThem.exists) {
      throw new HandledError("That student isn't available.", 403);
    }

    if (!teacher.skillsTeach.some((s) => s.skillId === input.skillId)) {
      throw new HandledError("They don't teach that skill.", 400);
    }

    if (learner.coinBalance < COINS.sessionCost) {
      throw new HandledError(
        `You need ${COINS.sessionCost} SkillCoins to book. Teach a session to earn some.`,
        402,
      );
    }

    // One open request per pair per skill, so a teacher's inbox can't be flooded.
    const duplicate = await db
      .collection(COLLECTIONS.sessions)
      .where("learnerId", "==", learner.uid)
      .where("teacherId", "==", input.teacherId)
      .where("skillId", "==", input.skillId)
      .where("status", "in", ["requested", "accepted"])
      .limit(1)
      .get();

    if (!duplicate.empty) {
      throw new HandledError("You already have a request open with them for this skill.", 409);
    }

    const ref = db.collection(COLLECTIONS.sessions).doc();
    const now = Date.now();

    const session: Omit<Session, "id"> = {
      teacherId: input.teacherId,
      learnerId: learner.uid,
      skillId: input.skillId,
      status: "requested",
      mode: "video",
      scheduledAt: input.scheduledAt,
      durationMins: input.durationMins,
      roomId: roomIdFor(ref.id),
      coinAmount: COINS.sessionCost,
      note: input.note,
      teacherConfirmedAt: null,
      learnerConfirmedAt: null,
      settledAt: null,
      createdAt: now,
      updatedAt: now,
    };

    await ref.set(session);

    await db
      .collection(COLLECTIONS.users)
      .doc(input.teacherId)
      .collection("notifications")
      .add({
        type: "booking_request",
        title: "New session request",
        body: `${learner.displayName} wants to learn from you.`,
        href: `/sessions/${ref.id}`,
        read: false,
        createdAt: now,
      });

    return ok({ sessionId: ref.id });
  } catch (error) {
    return apiError(error);
  }
}
