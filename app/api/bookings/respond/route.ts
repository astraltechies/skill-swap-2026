import { apiError, HandledError, ok, parseBody } from "@/lib/api";
import { adminDb, requireConsentedUser } from "@/lib/firebase/admin";
import { bookingRespondSchema } from "@/lib/validation/schemas";
import { COLLECTIONS, type ChatThread, type Session } from "@/types/firestore";

/**
 * The teacher accepts or declines. Accepting opens the chat thread — there is
 * no way to message someone who has not agreed to teach you, which keeps
 * unsolicited contact off the platform by construction.
 */
export async function POST(request: Request) {
  try {
    const user = await requireConsentedUser();
    const { sessionId, accept } = await parseBody(request, bookingRespondSchema);

    const db = adminDb();
    const ref = db.collection(COLLECTIONS.sessions).doc(sessionId);
    const snap = await ref.get();

    if (!snap.exists) throw new HandledError("That session no longer exists.", 404);
    const session = { ...snap.data(), id: snap.id } as Session;

    if (session.teacherId !== user.uid) {
      throw new HandledError("Only the teacher can respond to this request.", 403);
    }
    if (session.status !== "requested") {
      throw new HandledError("This request has already been answered.", 409);
    }

    const now = Date.now();
    await ref.update({
      status: accept ? "accepted" : "declined",
      updatedAt: now,
    });

    if (accept) {
      // Deterministic thread id keeps a pair to a single conversation across
      // however many sessions they book together.
      const threadId = [session.teacherId, session.learnerId].sort().join("_");
      const threadRef = db.collection(COLLECTIONS.chatThreads).doc(threadId);

      if (!(await threadRef.get()).exists) {
        const thread: Omit<ChatThread, "id"> = {
          participantIds: [session.teacherId, session.learnerId].sort(),
          lastMessage: "Session confirmed — say hello.",
          lastMessageAt: now,
          lastSenderId: "",
          createdAt: now,
        };
        await threadRef.set(thread);
      }
    }

    await db
      .collection(COLLECTIONS.users)
      .doc(session.learnerId)
      .collection("notifications")
      .add({
        type: accept ? "booking_accepted" : "booking_declined",
        title: accept ? "Session confirmed" : "Request declined",
        body: accept
          ? `${user.displayName} accepted your request.`
          : `${user.displayName} can't make that time.`,
        href: `/sessions/${sessionId}`,
        read: false,
        createdAt: now,
      });

    return ok();
  } catch (error) {
    return apiError(error);
  }
}
