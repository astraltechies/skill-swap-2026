import { apiError, HandledError, ok, parseBody } from "@/lib/api";
import { adminAuth, adminDb, requireAdmin } from "@/lib/firebase/admin";
import { COLLECTIONS, type AdminActionType, type Report } from "@/types/firestore";
import { z } from "zod";

/**
 * Two ways in.
 *
 * Through a report, which is the usual path and keeps the report and the
 * account in step. Or directly against an account, because a moderator who can
 * see something is wrong should not have to wait for someone to file a report
 * before they can act — and reinstating has no report to hang off at all once
 * the original one is closed.
 */
const bodySchema = z.union([
  z.object({
    reportId: z.string().min(1),
    action: z.enum(["resolve", "dismiss", "suspend", "ban", "reinstate"]),
    notes: z.string().trim().max(1000).default(""),
  }),
  z.object({
    userId: z.string().min(1),
    action: z.enum(["suspend", "ban", "reinstate"]),
    notes: z.string().trim().max(1000).default(""),
  }),
]);

const ACTION_LOG: Record<string, AdminActionType> = {
  resolve: "resolve_report",
  dismiss: "dismiss_report",
  suspend: "suspend_user",
  ban: "ban_user",
  reinstate: "unban_user",
};

const STATUS_FOR: Record<string, "active" | "suspended" | "banned"> = {
  suspend: "suspended",
  ban: "banned",
  reinstate: "active",
};

/**
 * Every path writes an `adminActions` row alongside the change, so there is a
 * record of who did what and why — a moderator cannot quietly ban someone.
 */
export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const input = await parseBody(request, bodySchema);
    const { action, notes } = input;

    const db = adminDb();
    const batch = db.batch();
    const now = Date.now();

    let targetUid: string;
    let logContext: string;

    if ("reportId" in input) {
      const reportRef = db.collection(COLLECTIONS.reports).doc(input.reportId);
      const snap = await reportRef.get();
      if (!snap.exists) throw new HandledError("That report no longer exists.", 404);

      const report = snap.data() as Report;
      targetUid = report.reportedUserId;
      logContext = `Report ${input.reportId}`;

      batch.update(reportRef, {
        status: action === "dismiss" ? "dismissed" : "resolved",
        adminNotes: notes,
        resolvedBy: admin.uid,
        resolvedAt: now,
      });

      // A dismissed report should not leave the account flagged.
      if (action === "dismiss") {
        batch.update(db.collection(COLLECTIONS.users).doc(targetUid), {
          status: "active",
        });
      }
    } else {
      targetUid = input.userId;
      logContext = "Direct action";
    }

    if (targetUid === admin.uid) {
      throw new HandledError("You can't moderate your own account.", 400);
    }

    const userRef = db.collection(COLLECTIONS.users).doc(targetUid);
    if (!(await userRef.get()).exists) {
      throw new HandledError("That account no longer exists.", 404);
    }

    const nextStatus = STATUS_FOR[action];
    if (nextStatus) {
      batch.update(userRef, {
        status: nextStatus,
        // Reinstating clears the counter too, otherwise the account trips the
        // auto-review threshold again on its very next report.
        ...(action === "reinstate" ? { reportCount: 0 } : {}),
        updatedAt: now,
      });
    }

    batch.create(db.collection(COLLECTIONS.adminActions).doc(), {
      adminId: admin.uid,
      actionType: ACTION_LOG[action],
      targetId: targetUid,
      notes: `${logContext}: ${notes || "(no note)"}`,
      createdAt: now,
    });

    await batch.commit();

    // A banned account's session cookie must stop working immediately rather
    // than at its natural two-week expiry.
    if (action === "ban" || action === "suspend") {
      await adminAuth()
        .revokeRefreshTokens(targetUid)
        .catch(() => {});
    }

    return ok();
  } catch (error) {
    return apiError(error);
  }
}
