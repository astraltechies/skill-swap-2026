"use client";

import { Button } from "@/components/ui/button";
import { FieldError, Textarea } from "@/components/ui/field";
import { REPORT_REASON_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { ReportReason } from "@/types/firestore";
import { Check, Flag, ShieldAlert, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const REASONS: ReportReason[] = [
  "safety_concern",
  "harassment",
  "inappropriate_content",
  "spam",
  "no_show",
  "other",
];

/**
 * Reporting is deliberately two taps from anywhere a student can be reached.
 * It uses a native <dialog> so it traps focus and closes on Escape without a
 * modal library.
 */
export function ReportDialog({
  reportedUserId,
  reportedName,
  contentType,
  contentRef = null,
}: {
  reportedUserId: string;
  reportedName: string;
  contentType: "profile" | "message" | "session";
  contentRef?: string | null;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  async function submit() {
    if (!reason) return;
    setError("");
    setSubmitting(true);
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportedUserId,
          contentType,
          contentRef,
          reason,
          details: details.trim(),
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not send the report.");
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the report.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <Flag className="size-4" aria-hidden />
        Report
      </Button>

      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        className={cn(
          "m-0 w-full max-w-md rounded-t-2xl border border-line bg-surface p-0 text-ink",
          // Bottom sheet on a phone, centred dialog on a larger screen.
          "mt-auto sm:m-auto sm:rounded-2xl",
          "backdrop:bg-black/40 backdrop:backdrop-blur-sm",
        )}
      >
        {done ? (
          <div className="p-5 text-center">
            <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-full bg-success-wash">
              <Check className="size-5 text-success" aria-hidden />
            </div>
            <h2 className="font-display text-lg font-semibold">Report sent</h2>
            <p className="mt-1.5 text-sm text-muted">
              A moderator will look at this. If you feel unsafe, please also tell a parent,
              guardian or teacher.
            </p>
            <Button fullWidth className="mt-4" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        ) : (
          <div className="p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-semibold">Report {reportedName}</h2>
                <p className="mt-0.5 text-sm text-muted">
                  Only moderators see this. {reportedName} is not told who reported them.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-muted hover:bg-surface-sunk"
                aria-label="Close"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>

            <fieldset className="mb-4">
              <legend className="mb-2 text-sm font-medium">What happened?</legend>
              <div className="space-y-1.5">
                {REASONS.map((value) => (
                  <label
                    key={value}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors",
                      reason === value
                        ? "border-danger bg-danger-wash"
                        : "border-line hover:bg-surface-sunk",
                    )}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={value}
                      checked={reason === value}
                      onChange={() => setReason(value)}
                      className="accent-[var(--danger)]"
                    />
                    <span>{REPORT_REASON_LABELS[value]}</span>
                    {value === "safety_concern" ? (
                      <ShieldAlert className="ml-auto size-4 text-danger" aria-hidden />
                    ) : null}
                  </label>
                ))}
              </div>
            </fieldset>

            <Textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              maxLength={1000}
              placeholder="Anything else a moderator should know? (optional)"
              aria-label="Details"
              className="mb-3"
            />

            {error ? <FieldError>{error}</FieldError> : null}

            <div className="mt-3 flex gap-2">
              <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                variant="danger"
                disabled={!reason}
                loading={submitting}
                onClick={submit}
                className="flex-1"
              >
                Send report
              </Button>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
