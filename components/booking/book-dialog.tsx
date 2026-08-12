"use client";

import { Button } from "@/components/ui/button";
import { FieldError, Label, Select, Textarea } from "@/components/ui/field";
import { COINS, DEFAULT_SESSION_DURATION, SESSION_DURATIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Skill, SkillRef } from "@/types/firestore";
import { Check, Coins, Video, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/** Local datetime string for an <input type="datetime-local"> default. */
function defaultSlot(): string {
  const date = new Date(Date.now() + 1000 * 60 * 60 * 24);
  date.setMinutes(0, 0, 0);
  date.setHours(17);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function BookDialog({
  teacherId,
  teacherName,
  teaches,
  skillsById,
  myBalance,
  canBook,
}: {
  teacherId: string;
  teacherName: string;
  teaches: SkillRef[];
  skillsById: Map<string, Skill>;
  myBalance: number;
  /** False when the viewer has no consent on file yet. */
  canBook: boolean;
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [skillId, setSkillId] = useState(teaches[0]?.skillId ?? "");
  const [when, setWhen] = useState(defaultSlot);
  const [duration, setDuration] = useState<number>(DEFAULT_SESSION_DURATION);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const affordable = myBalance >= COINS.sessionCost;

  async function submit() {
    setError("");
    setSubmitting(true);
    try {
      const response = await fetch("/api/bookings/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId,
          skillId,
          scheduledAt: new Date(when).getTime(),
          durationMins: duration,
          note: note.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not send the request.");
      setDone(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the request.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!canBook) {
    return (
      <Button variant="outline" disabled title="Guardian consent is needed before booking">
        Consent needed to book
      </Button>
    );
  }

  return (
    <>
      <Button variant="learn" size="lg" onClick={() => setOpen(true)} disabled={teaches.length === 0}>
        <Video className="size-4" aria-hidden />
        Request a session
      </Button>

      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        className={cn(
          "m-0 mt-auto w-full max-w-md rounded-t-2xl border border-line bg-surface p-0 text-ink",
          "sm:m-auto sm:rounded-2xl",
          "backdrop:bg-black/40 backdrop:backdrop-blur-sm",
        )}
      >
        {done ? (
          <div className="p-5 text-center">
            <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-full bg-success-wash">
              <Check className="size-5 text-success" aria-hidden />
            </div>
            <h2 className="font-display text-lg font-semibold">Request sent</h2>
            <p className="mt-1.5 text-sm text-muted">
              {teacherName} will get a notification. Nothing is charged unless they accept and
              the session happens.
            </p>
            <Button fullWidth className="mt-4" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        ) : (
          <div className="p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <h2 className="font-display text-lg font-semibold">
                Book a session with {teacherName}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-muted hover:bg-surface-sunk"
                aria-label="Close"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="book-skill">What do you want to learn?</Label>
                <Select
                  id="book-skill"
                  value={skillId}
                  onChange={(e) => setSkillId(e.target.value)}
                >
                  {teaches.map((ref) => (
                    <option key={ref.skillId} value={ref.skillId}>
                      {skillsById.get(ref.skillId)?.name ?? ref.skillId}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="book-when">When?</Label>
                <input
                  id="book-when"
                  type="datetime-local"
                  value={when}
                  onChange={(e) => setWhen(e.target.value)}
                  className="h-11 w-full rounded-xl border border-line-strong bg-surface px-3.5 text-base focus:border-learn focus:outline-none focus:ring-2 focus:ring-learn/25"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="book-duration">How long?</Label>
                <Select
                  id="book-duration"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                >
                  {SESSION_DURATIONS.map((mins) => (
                    <option key={mins} value={mins}>
                      {mins} minutes
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="book-note" hint="Optional">
                  Anything they should know?
                </Label>
                <Textarea
                  id="book-note"
                  value={note}
                  maxLength={300}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="I'm a complete beginner and I have my own guitar."
                />
              </div>

              <p className="flex items-start gap-2 rounded-xl bg-surface-sunk px-3 py-2.5 text-sm text-muted">
                <Coins className="mt-0.5 size-4 shrink-0 text-teach" aria-hidden />
                <span>
                  Costs <span className="tabular font-medium text-ink">{COINS.sessionCost}</span>{" "}
                  SkillCoins, taken only when the session is marked complete. You have{" "}
                  <span className="tabular font-medium text-ink">{myBalance}</span>.
                </span>
              </p>

              <p className="flex items-start gap-2 text-xs text-muted">
                <Video className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                <span>This is a video session. Skill Swap never arranges meetings in person.</span>
              </p>

              {!affordable ? (
                <FieldError>
                  You need {COINS.sessionCost} SkillCoins to book. Teach a session to earn some.
                </FieldError>
              ) : null}

              {error ? <FieldError>{error}</FieldError> : null}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button
                  variant="learn"
                  onClick={submit}
                  loading={submitting}
                  disabled={!affordable || !skillId}
                  className="flex-1"
                >
                  Send request
                </Button>
              </div>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
