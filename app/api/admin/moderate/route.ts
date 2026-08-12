import { apiError, HandledError, ok, parseBody } from "@/lib/api";
import { adminDb, requireAdmin } from "@/lib/firebase/admin";
import { COLLECTIONS, type AdminActionType, type Report } from "@/types/firestore";
import { z } from "zod";

const bodySchema = z.object({
  reportId: z.string().min(1),
  action: z.enum(["resolve", "dismiss", "suspend", "ban", "reinstate"]),
  notes: z.string().trim().max(1000).default(""),
});

const ACTION_LOG: Record<string, AdminActionType> = {
  resolve: "resolve_report",
  dismiss: "dismiss_report",
  suspend: "suspend_user",
  ban: "ban_user",
  reinstate: "unban_user",
};

/**
 * Acts on a report.
 *
 * Every path writes an `adminActions` row alongside the change, so there is a
 * record of who did what and why — a moderator cannot quietly ban someone.
 */
export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const { reportId, action, notes } = await parseBody(request, bodySchema);

    const db = adminDb();
    const reportRef = db.collection(COLLECTIONS.reports).doc(reportId);
    const snap = await reportRef.get();
    if (!snap.exists) throw new HandledError("That report no longer exists.", 404);

    const report = snap.data() as Report;
    const now = Date.now();
    const batch = db.batch();
    const userRef = db.collection(COLLECTIONS.users).doc(report.reportedUserId);

    if (action === "dismiss") {
      batch.update(reportRef, {
        status: "dismissed",
        adminNotes: notes,
        resolvedBy: admin.uid,
        resolvedAt: now,
      });
      // A dismissed report should not leave the account flagged.
      batch.update(userRef, { status: "active" });
    } else {
      batch.update(reportRef, {
        status: "resolved",
        adminNotes: notes,
        resolvedBy: admin.uid,
        resolvedAt: now,
      });

      if (action === "suspend") batch.update(userRef, { status: "suspended" });
      if (action === "ban") batch.update(userRef, { status: "banned" });
      if (action === "reinstate") batch.update(userRef, { status: "active", reportCount: 0 });
    }

    batch.create(db.collection(COLLECTIONS.adminActions).doc(), {
      adminId: admin.uid,
      actionType: ACTION_LOG[action],
      targetId: report.reportedUserId,
      notes: `Report ${reportId}: ${notes || "(no note)"}`,
      createdAt: now,
    });

    await batch.commit();

    // A banned account's session cookie must stop working immediately rather
    // than at its natural two-week expiry.
    if (action === "ban" || action === "suspend") {
      await import("@/lib/firebase/admin").then(({ adminAuth }) =>
        adminAuth().revokeRefreshTokens(report.reportedUserId).catch(() => {}),
      );
    }

    return ok();
  } catch (error) {
    return apiError(error);
  }
}
