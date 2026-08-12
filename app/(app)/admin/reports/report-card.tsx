"use client";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { FieldError, Textarea } from "@/components/ui/field";
import { Pill } from "@/components/ui/pill";
import { REPORT_REASON_LABELS } from "@/lib/constants";
import { timeAgo } from "@/lib/utils";
import type { Report, UserProfile } from "@/types/firestore";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Action = "resolve" | "dismiss" | "suspend" | "ban" | "reinstate";

export function ReportCard({
  report,
  reporter,
  reported,
  readOnly = false,
}: {
  report: Report;
  reporter: UserProfile | undefined;
  reported: UserProfile | undefined;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState(report.adminNotes);
  const [pending, setPending] = useState<Action | null>(null);
  const [error, setError] = useState("");

  async function act(action: Action) {
    setError("");
    setPending(action);
    try {
      const response = await fetch("/api/admin/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId: report.id, action, notes: notes.trim() }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "That didn't work.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "That didn't work.");
    } finally {
      setPending(null);
    }
  }

  const high = report.priority === "high";

  return (
    <li>
      <Card className={high && !readOnly ? "border-danger/40" : undefined}>
        <CardBody className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {high ? (
              <Pill tone="danger">
                <ShieldAlert className="size-3" aria-hidden />
                High priority
              </Pill>
            ) : null}
            <Pill tone="neutral">{REPORT_REASON_LABELS[report.reason] ?? report.reason}</Pill>
            <Pill tone={report.status === "open" ? "neutral" : "success"}>{report.status}</Pill>
            <span className="text-xs text-muted">{timeAgo(report.createdAt)}</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="flex items-center gap-2">
              <Avatar
                name={reported?.displayName ?? "Unknown"}
                src={reported?.photoURL}
                size="sm"
              />
              <span>
                <span className="block text-xs text-muted">Reported</span>
                {reported ? (
                  <Link
                    href={`/u/${reported.username}`}
                    className="font-medium underline-offset-2 hover:underline"
                  >
                    {reported.displayName}
                  </Link>
                ) : (
                  <span className="font-medium">Unknown</span>
                )}
                {reported ? (
                  <span className="ml-1.5 text-xs text-muted">({reported.status})</span>
                ) : null}
              </span>
            </span>

            <span className="text-sm">
              <span className="block text-xs text-muted">Reported by</span>
              <span className="font-medium">{reporter?.displayName ?? "Unknown"}</span>
            </span>
          </div>

          {report.details ? (
            <blockquote className="rounded-xl bg-surface-sunk px-3.5 py-2.5 text-sm text-ink-soft">
              {report.details}
            </blockquote>
          ) : (
            <p className="text-sm italic text-muted">No extra detail given.</p>
          )}

          {readOnly ? (
            report.adminNotes ? (
              <p className="text-sm text-muted">
                <span className="font-medium text-ink">Moderator note:</span>{" "}
                {report.adminNotes}
              </p>
            ) : null
          ) : (
            <>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={1000}
                placeholder="What did you decide, and why? (recorded in the audit log)"
                aria-label="Moderator notes"
                className="min-h-16"
              />

              {error ? <FieldError>{error}</FieldError> : null}

              <div className="flex flex-wrap gap-2">
                <Button size="sm" loading={pending === "resolve"} onClick={() => act("resolve")}>
                  Resolve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  loading={pending === "dismiss"}
                  onClick={() => act("dismiss")}
                >
                  Dismiss
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  loading={pending === "suspend"}
                  onClick={() => act("suspend")}
                >
                  Suspend account
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  loading={pending === "ban"}
                  onClick={() => act("ban")}
                >
                  Ban
                </Button>
                {reported && reported.status !== "active" ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    loading={pending === "reinstate"}
                    onClick={() => act("reinstate")}
                  >
                    Reinstate
                  </Button>
                ) : null}
              </div>
            </>
          )}
        </CardBody>
      </Card>
    </li>
  );
}
