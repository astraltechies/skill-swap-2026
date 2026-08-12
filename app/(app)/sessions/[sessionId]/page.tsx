import { JitsiRoom } from "@/components/sessions/jitsi-room";
import { PageContainer } from "@/components/shell/page";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardBody } from "@/components/ui/card";
import { Pill, SessionStatusPill } from "@/components/ui/pill";
import { requireUser } from "@/lib/firebase/admin";
import { getSessionById, getSkillsMap, getUserById } from "@/lib/queries";
import { formatSessionTime } from "@/lib/utils";
import { COLLECTIONS } from "@/types/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { ArrowLeft, Coins, Info, MessageSquare, Video } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SessionActions } from "./session-actions";

export const metadata: Metadata = {
  title: "Session",
  robots: { index: false, follow: false },
};

/** Video opens ten minutes early and stays reachable for a while after. */
const EARLY_MS = 1000 * 60 * 10;
const LATE_MS = 1000 * 60 * 90;

export default async function SessionPage({ params }: PageProps<"/sessions/[sessionId]">) {
  const { sessionId } = await params;

  // Identity and the session document are independent lookups — fetching the
  // session only after the user resolved added a whole round trip. The
  // authorisation check below is unchanged; it just happens a beat earlier.
  const [me, session, skillsById] = await Promise.all([
    requireUser(),
    getSessionById(sessionId),
    getSkillsMap(),
  ]);

  if (!session) notFound();

  // Authorisation, not just a UI guard — a session belongs to exactly two people.
  if (session.teacherId !== me.uid && session.learnerId !== me.uid) notFound();

  const viewerIsTeacher = session.teacherId === me.uid;
  const otherId = viewerIsTeacher ? session.learnerId : session.teacherId;

  const [other, existingRating] = await Promise.all([
    getUserById(otherId),
    adminDb()
      .collection(COLLECTIONS.ratings)
      .doc(`${session.id}_${me.uid}`)
      .get()
      .then((snap) => snap.exists),
  ]);

  const skillName = skillsById.get(session.skillId)?.name ?? "a skill";

  // Server Component: one render per request, so the clock is stable for it.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const videoOpen =
    session.status === "accepted" &&
    now > session.scheduledAt - EARLY_MS &&
    now < session.scheduledAt + LATE_MS;

  const threadId = [session.teacherId, session.learnerId].sort().join("_");

  return (
    <PageContainer width="narrow">
      <Link
        href="/sessions"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden />
        All sessions
      </Link>

      <div className="mb-5">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <SessionStatusPill status={session.status} />
          <Pill tone={viewerIsTeacher ? "teach" : "learn"}>
            {viewerIsTeacher ? "You're teaching" : "You're learning"}
          </Pill>
          <Pill tone="neutral">
            <Video className="size-3" aria-hidden />
            Video only
          </Pill>
        </div>

        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          {skillName}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {formatSessionTime(new Date(session.scheduledAt))} · {session.durationMins} minutes
        </p>
      </div>

      <Card className="mb-5">
        <CardBody className="flex items-center gap-3">
          <Avatar name={other?.displayName ?? "Student"} src={other?.photoURL} size="md" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{other?.displayName ?? "Student"}</p>
            <p className="truncate text-sm text-muted">
              {viewerIsTeacher ? "Learning from you" : "Teaching you"}
            </p>
          </div>
          {session.status === "accepted" || session.status === "completed" ? (
            <Link
              href={`/chat/${threadId}`}
              className="rounded-xl border border-line-strong px-3 py-2 text-sm pressable transition-colors duration-(--duration-fast) hover:bg-surface-sunk"
            >
              <MessageSquare className="size-4" aria-hidden />
              <span className="sr-only">Open chat</span>
            </Link>
          ) : null}
        </CardBody>
      </Card>

      {session.note ? (
        <Card className="mb-5">
          <CardBody>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
              Their note
            </p>
            <p className="text-sm text-ink-soft">{session.note}</p>
          </CardBody>
        </Card>
      ) : null}

      {videoOpen ? (
        <div className="mb-5">
          <JitsiRoom
            roomId={session.roomId}
            displayName={me.displayName}
            domain={process.env.NEXT_PUBLIC_JITSI_DOMAIN ?? "meet.jit.si"}
          />
        </div>
      ) : session.status === "accepted" ? (
        <Card className="mb-5 border-dashed">
          <CardBody className="flex items-start gap-3">
            <Info className="mt-0.5 size-5 shrink-0 text-muted" aria-hidden />
            <p className="text-sm text-muted">
              The video call opens ten minutes before the start time. Come back then.
            </p>
          </CardBody>
        </Card>
      ) : null}

      <Card className="mb-5">
        <CardBody className="flex items-center gap-3">
          <Coins className="size-5 shrink-0 text-teach" aria-hidden />
          <p className="text-sm text-ink-soft">
            {session.status === "completed" ? (
              <>
                {viewerIsTeacher ? "You earned" : "You spent"}{" "}
                <span className="tabular font-semibold text-ink">{session.coinAmount}</span>{" "}
                SkillCoins.
              </>
            ) : (
              <>
                {viewerIsTeacher ? "You'll earn" : "This costs"}{" "}
                <span className="tabular font-semibold text-ink">{session.coinAmount}</span>{" "}
                SkillCoins, transferred when the session is marked complete.
              </>
            )}
          </p>
        </CardBody>
      </Card>

      <SessionActions
        session={session}
        viewerIsTeacher={viewerIsTeacher}
        otherName={other?.displayName ?? "them"}
        otherId={otherId}
        alreadyRated={existingRating}
      />
    </PageContainer>
  );
}
