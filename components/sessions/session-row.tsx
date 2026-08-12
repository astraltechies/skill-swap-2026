import { Avatar } from "@/components/ui/avatar";
import { SessionStatusPill } from "@/components/ui/pill";
import { formatSessionTime } from "@/lib/utils";
import type { Session, UserProfile } from "@/types/firestore";
import { ArrowUpRight, Video } from "lucide-react";
import Link from "next/link";

/** How close to the start time the Join button appears. */
const JOIN_WINDOW_MS = 1000 * 60 * 10;

export function SessionRow({
  session,
  other,
  skillName,
  viewerIsTeacher,
}: {
  session: Session;
  other: UserProfile | undefined;
  skillName: string;
  viewerIsTeacher: boolean;
}) {
  // Server Component: rendered once per request, so the clock is stable here.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();

  const joinable =
    session.status === "accepted" &&
    now > session.scheduledAt - JOIN_WINDOW_MS &&
    now < session.scheduledAt + 1000 * 60 * 90;

  return (
    <li>
      <Link
        href={`/sessions/${session.id}`}
        className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 transition-colors hover:bg-surface-sunk sm:p-4"
      >
        <Avatar name={other?.displayName ?? "Unknown"} src={other?.photoURL} size="md" />

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            <span className={viewerIsTeacher ? "text-teach-ink" : "text-learn-ink"}>
              {viewerIsTeacher ? "Teaching" : "Learning"} {skillName}
            </span>
          </p>
          <p className="truncate text-sm text-muted">
            with {other?.displayName ?? "a student"}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted">
            {formatSessionTime(new Date(session.scheduledAt))} · {session.durationMins} min
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {joinable ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-learn px-3 py-1.5 text-xs font-semibold text-white">
              <Video className="size-3.5" aria-hidden />
              Join
            </span>
          ) : (
            <SessionStatusPill status={session.status} />
          )}
          <ArrowUpRight className="size-4 text-muted" aria-hidden />
        </div>
      </Link>
    </li>
  );
}
