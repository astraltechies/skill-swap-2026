import { PageContainer, PageHeader } from "@/components/shell/page";
import { SessionRow } from "@/components/sessions/session-row";
import { Button } from "@/components/ui/button";
import { EmptyState, SectionHeading } from "@/components/ui/card";
import { requireUser } from "@/lib/firebase/admin";
import { getSessionsForUser, getSkillsMap, getUsersByIds } from "@/lib/queries";
import type { Session } from "@/types/firestore";
import { CalendarDays } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sessions",
  robots: { index: false, follow: false },
};

const OPEN_STATUSES: Session["status"][] = ["requested", "accepted"];

export default async function SessionsPage() {
  const me = await requireUser();
  const [sessions, skillsById] = await Promise.all([
    getSessionsForUser(me.uid),
    getSkillsMap(),
  ]);

  const others = await getUsersByIds(
    sessions.map((s) => (s.teacherId === me.uid ? s.learnerId : s.teacherId)),
  );

  const needsYourReply = sessions.filter(
    (s) => s.status === "requested" && s.teacherId === me.uid,
  );
  const upcoming = sessions
    .filter(
      (s) =>
        OPEN_STATUSES.includes(s.status) &&
        !(s.status === "requested" && s.teacherId === me.uid),
    )
    .sort((a, b) => a.scheduledAt - b.scheduledAt);
  const past = sessions.filter((s) => !OPEN_STATUSES.includes(s.status));

  const render = (list: Session[]) => (
    <ul className="space-y-2.5">
      {list.map((session) => (
        <SessionRow
          key={session.id}
          session={session}
          other={others.get(session.teacherId === me.uid ? session.learnerId : session.teacherId)}
          skillName={skillsById.get(session.skillId)?.name ?? "a skill"}
          viewerIsTeacher={session.teacherId === me.uid}
        />
      ))}
    </ul>
  );

  return (
    <PageContainer>
      <PageHeader title="Sessions" />

      {needsYourReply.length > 0 ? (
        <section className="mb-8">
          <SectionHeading
            title="Waiting on you"
            subtitle="Someone asked you to teach them."
          />
          {render(needsYourReply)}
        </section>
      ) : null}

      <section className="mb-8">
        <SectionHeading title="Upcoming" />
        {upcoming.length > 0 ? (
          render(upcoming)
        ) : (
          <EmptyState
            icon={<CalendarDays className="size-7" aria-hidden />}
            title="Nothing booked"
            body="Find someone teaching what you want to learn and send a request."
            action={
              <Button asChild variant="learn">
                <Link href="/browse">Browse skills</Link>
              </Button>
            }
          />
        )}
      </section>

      {past.length > 0 ? (
        <section>
          <SectionHeading title="Past" />
          {render(past)}
        </section>
      ) : null}
    </PageContainer>
  );
}
