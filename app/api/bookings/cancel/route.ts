import { apiError, HandledError, ok, parseBody } from "@/lib/api";
import { adminDb, requireUser } from "@/lib/firebase/admin";
import { COLLECTIONS, type Session } from "@/types/firestore";
import { z } from "zod";

const bodySchema = z.object({ sessionId: z.string().min(1) });

/** Either side can cancel while it is still upcoming. No coins have moved yet. */
export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const { sessionId } = await parseBody(request, bodySchema);

    const db = adminDb();
    const ref = db.collection(COLLECTIONS.sessions).doc(sessionId);
    const snap = await ref.get();

    if (!snap.exists) throw new HandledError("That session no longer exists.", 404);
    const session = snap.data() as Session;

    if (session.teacherId !== user.uid && session.learnerId !== user.uid) {
      throw new HandledError("You weren't part of this session.", 403);
    }
    if (!["requested", "accepted"].includes(session.status)) {
      throw new HandledError("This session can't be cancelled any more.", 409);
    }

    const now = Date.now();
    await ref.update({ status: "cancelled", updatedAt: now });

    const otherId = session.teacherId === user.uid ? session.learnerId : session.teacherId;
    await db
      .collection(COLLECTIONS.users)
      .doc(otherId)
      .collection("notifications")
      .add({
        type: "booking_declined",
        title: "Session cancelled",
        body: `${user.displayName} cancelled your session.`,
        href: `/sessions/${sessionId}`,
        read: false,
        createdAt: now,
      });

    return ok();
  } catch (error) {
    return apiError(error);
  }
}
