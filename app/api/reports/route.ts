import { apiError, HandledError, ok, parseBody } from "@/lib/api";
import { HIGH_PRIORITY_REASONS } from "@/lib/constants";
import { adminDb, requireUser } from "@/lib/firebase/admin";
import { reportSchema } from "@/lib/validation/schemas";
import { COLLECTIONS, type UserProfile } from "@/types/firestore";
import { FieldValue } from "firebase-admin/firestore";

/** Reports past this many auto-flag the account for a moderator to look at. */
const AUTO_REVIEW_THRESHOLD = 3;

/**
 * Files a safety report.
 *
 * Priority is decided here, never sent by the client — otherwise anyone could
 * file "high priority" reports and bury the genuine ones. Consent is *not*
 * required to report: a student whose guardian consent has lapsed must still
 * be able to raise a safety concern.
 */
export async function POST(request: Request) {
  try {
    const reporter = await requireUser();
    const input = await parseBody(request, reportSchema);

    if (input.reportedUserId === reporter.uid) {
      throw new HandledError("You can't report yourself.", 400);
    }

    const db = adminDb();
    const reportedRef = db.collection(COLLECTIONS.users).doc(input.reportedUserId);
    if (!(await reportedRef.get()).exists) {
      throw new HandledError("That student no longer exists.", 404);
    }

    // One open report per reporter per person, so the queue reflects distinct
    // concerns rather than one person filing repeatedly.
    const existing = await db
      .collection(COLLECTIONS.reports)
      .where("reporterId", "==", reporter.uid)
      .where("reportedUserId", "==", input.reportedUserId)
      .where("status", "in", ["open", "in_review"])
      .limit(1)
      .get();

    if (!existing.empty) {
      throw new HandledError(
        "You've already reported this person. A moderator is looking at it.",
        409,
      );
    }

    const now = Date.now();

    await db.collection(COLLECTIONS.reports).add({
      reporterId: reporter.uid,
      reportedUserId: input.reportedUserId,
      contentType: input.contentType,
      contentRef: input.contentRef,
      reason: input.reason,
      details: input.details,
      priority: HIGH_PRIORITY_REASONS.has(input.reason) ? "high" : "normal",
      status: "open",
      adminNotes: "",
      resolvedBy: null,
      resolvedAt: null,
      createdAt: now,
    });

    const updatedSnap = await reportedRef.get();
    const reported = updatedSnap.data() as UserProfile;
    const nextCount = (reported.reportCount ?? 0) + 1;

    await reportedRef.update({
      reportCount: FieldValue.increment(1),
      // Flagging is not a ban. It puts the account in front of a moderator
      // while leaving it usable, so a pile-on cannot silence someone.
      ...(nextCount >= AUTO_REVIEW_THRESHOLD && reported.status === "active"
        ? { status: "under_review" }
        : {}),
    });

    return ok();
  } catch (error) {
    return apiError(error);
  }
}
