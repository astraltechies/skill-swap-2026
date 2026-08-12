"use client";

import { ReportDialog } from "@/components/safety/report-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { FieldError, Textarea } from "@/components/ui/field";
import { SESSION_COMPLETE_WINDOW_MS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Session } from "@/types/firestore";
import { Check, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function SessionActions({
  session,
  viewerIsTeacher,
  otherName,
  otherId,
  alreadyRated,
}: {
  session: Session;
  viewerIsTeacher: boolean;
  otherName: string;
  otherId: string;
  alreadyRated: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [rated, setRated] = useState(alreadyRated);

  async function post(url: string, body: object, key: string) {
    setError("");
    setPending(key);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "That didn't work. Try again.");
      }
      router.refresh();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "That didn't work.");
      return false;
    } finally {
      setPending(null);
    }
  }

  /**
   * The clock is read after mount, never during render: the server and the
   * browser would otherwise disagree about whether the session has started and
   * hydration would flip the Complete button. Re-reading on an interval also
   * means the button appears the moment the session begins, with no refresh.
   */
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    // The first read is deferred rather than run inline, so the page paints
    // once instead of rendering twice before the browser ever shows it.
    const initial = setTimeout(tick, 0);
    const timer = setInterval(tick, 30_000);
    return () => {
      clearTimeout(initial);
      clearInterval(timer);
    };
  }, []);

  const canComplete =
    now !== null &&
    session.status === "accepted" &&
    now >= session.scheduledAt &&
    now <= session.scheduledAt + SESSION_COMPLETE_WINDOW_MS;

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-xl border border-danger/30 bg-danger-wash px-3.5 py-3">
          <FieldError>{error}</FieldError>
        </div>
      ) : null}

      {session.status === "requested" && viewerIsTeacher ? (
        <div className="flex gap-2">
          <Button
            variant="learn"
            size="lg"
            fullWidth
            loading={pending === "accept"}
            onClick={() =>
              post("/api/bookings/respond", { sessionId: session.id, accept: true }, "accept")
            }
          >
            Accept
          </Button>
          <Button
            variant="outline"
            size="lg"
            loading={pending === "decline"}
            onClick={() =>
              post("/api/bookings/respond", { sessionId: session.id, accept: false }, "decline")
            }
          >
            Decline
          </Button>
        </div>
      ) : null}

      {session.status === "requested" && !viewerIsTeacher ? (
        <p className="text-sm text-muted">
          Waiting for {otherName} to reply. You&apos;ll get a notification either way.
        </p>
      ) : null}

      {canComplete ? (
        <Button
          size="lg"
          fullWidth
          loading={pending === "complete"}
          onClick={() => post("/api/sessions/complete", { sessionId: session.id }, "complete")}
        >
          <Check className="size-4" aria-hidden />
          Mark complete
          {viewerIsTeacher ? ` and earn ${session.coinAmount}` : ""}
        </Button>
      ) : null}

      {session.status === "completed" && !rated ? (
        <Card>
          <CardBody className="space-y-3">
            <div>
              <h2 className="font-display text-base font-semibold">
                How did it go with {otherName}?
              </h2>
              <p className="mt-0.5 text-sm text-muted">
                Ratings are public on their profile.
              </p>
            </div>

            <div className="flex gap-1" role="group" aria-label="Rating out of five">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStars(value)}
                  aria-pressed={stars === value}
                  aria-label={`${value} ${value === 1 ? "star" : "stars"}`}
                  className="rounded-lg p-1.5 transition-transform active:scale-90"
                >
                  <Star
                    className={cn(
                      "size-7",
                      value <= stars ? "fill-teach text-teach" : "text-line-strong",
                    )}
                    aria-hidden
                  />
                </button>
              ))}
            </div>

            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={300}
              placeholder="What was helpful? (optional)"
              aria-label="Comment"
            />

            <Button
              fullWidth
              disabled={stars === 0}
              loading={pending === "rate"}
              onClick={async () => {
                const done = await post(
                  "/api/ratings",
                  { sessionId: session.id, stars, comment: comment.trim() },
                  "rate",
                );
                if (done) setRated(true);
              }}
            >
              Submit rating
            </Button>
          </CardBody>
        </Card>
      ) : null}

      {session.status === "completed" && rated ? (
        <p className="flex items-center gap-1.5 text-sm text-success">
          <Check className="size-4" aria-hidden />
          You rated this session.
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
        {["requested", "accepted"].includes(session.status) ? (
          <Button
            variant="ghost"
            size="sm"
            loading={pending === "cancel"}
            onClick={() => post("/api/bookings/cancel", { sessionId: session.id }, "cancel")}
          >
            Cancel session
          </Button>
        ) : null}

        <ReportDialog
          reportedUserId={otherId}
          reportedName={otherName}
          contentType="session"
          contentRef={session.id}
        />
      </div>
    </div>
  );
}
