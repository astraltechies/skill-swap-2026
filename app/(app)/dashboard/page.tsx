import { SwapCard } from "@/components/swap/swap-card";
import { PageContainer, PageHeader } from "@/components/shell/page";
import { SessionRow } from "@/components/sessions/session-row";
import { Button } from "@/components/ui/button";
import { Card, CardBody, EmptyState, SectionHeading } from "@/components/ui/card";
import { COINS } from "@/lib/constants";
import { requireUser } from "@/lib/firebase/admin";
import { findMatches } from "@/lib/matching/score";
import {
  getBlockedIds,
  getSessionsForUser,
  getSkillsMap,
  getTeachingUsers,
  getUsersByIds,
} from "@/lib/queries";
import type { Metadata } from "next";
import { ArrowRight, Coins, Sparkles, UserRoundPlus, Video } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Home",
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  const me = await requireUser();

  // One wave, not two: the candidate pool doesn't depend on this user's
  // sessions or blocklist, so fetching it separately below only added a round
  // trip to the critical path.
  const [skillsById, sessions, blocked, candidates] = await Promise.all([
    getSkillsMap(),
    getSessionsForUser(me.uid),
    getBlockedIds(me.uid),
    getTeachingUsers(),
  ]);

  // Server Component: this renders once per request, so reading the clock here
  // is deterministic for that render. The purity rule targets Client
  // Components, where a re-render could produce a different answer.
  // eslint-disable-next-line react-hooks/purity
  const cutoff = Date.now() - 1000 * 60 * 90;

  const upcoming = sessions
    .filter((s) => ["requested", "accepted"].includes(s.status) && s.scheduledAt > cutoff)
    .sort((a, b) => a.scheduledAt - b.scheduledAt)
    .slice(0, 3);

  const matches = findMatches(me, candidates, { limit: 4, excludeUids: blocked });

  const otherIds = [
    ...upcoming.map((s) => (s.teacherId === me.uid ? s.learnerId : s.teacherId)),
    ...matches.map((m) => m.otherUid),
  ];
  const others = await getUsersByIds(otherIds);

  const needsSkills = me.skillsTeach.length === 0 || me.skillsLearn.length === 0;
  const firstName = me.displayName.split(" ")[0];

  return (
    <PageContainer width="wide">
      <PageHeader
        title={`Hi ${firstName}`}
        subtitle={
          needsSkills
            ? "Add what you can teach and what you want to learn — that's how matches happen."
            : "Here's what's next."
        }
        action={
          <div className="hidden items-center gap-2 rounded-full border border-teach/30 bg-teach-wash px-3.5 py-2 md:flex">
            <Coins className="size-4 text-teach-ink" aria-hidden />
            <span className="tabular font-semibold text-teach-ink">{me.coinBalance}</span>
            <span className="text-sm text-teach-ink/80">SkillCoins</span>
          </div>
        }
      />

      {needsSkills ? (
        <Card className="mb-6 border-learn/30 bg-learn-wash">
          <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-base font-semibold">Finish your profile</h2>
              <p className="mt-1 text-sm text-ink-soft">
                {me.skillsTeach.length === 0 && me.skillsLearn.length === 0
                  ? "Add one thing you can teach and one you want to learn."
                  : me.skillsTeach.length === 0
                    ? "Add something you can teach so others can find you."
                    : "Add something you want to learn to start getting matches."}
              </p>
            </div>
            <Button asChild variant="learn" className="shrink-0">
              <Link href="/profile/edit">
                Add skills
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </CardBody>
        </Card>
      ) : null}

      <section className="mb-8">
        <SectionHeading
          title="Next up"
          action={
            sessions.length > 0 ? (
              <Button asChild variant="ghost" size="sm">
                <Link href="/sessions">All sessions</Link>
              </Button>
            ) : undefined
          }
        />

        {upcoming.length > 0 ? (
          <ul className="space-y-2.5">
            {upcoming.map((session) => (
              <SessionRow
                key={session.id}
                session={session}
                other={others.get(
                  session.teacherId === me.uid ? session.learnerId : session.teacherId,
                )}
                skillName={skillsById.get(session.skillId)?.name ?? "a skill"}
                viewerIsTeacher={session.teacherId === me.uid}
              />
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={<Video className="size-7" aria-hidden />}
            title="No sessions booked"
            body="Find someone who teaches what you want to learn, and send them a request."
            action={
              <Button asChild variant="learn">
                <Link href="/browse">Browse skills</Link>
              </Button>
            }
          />
        )}
      </section>

      <section>
        <SectionHeading
          title="Your matches"
          subtitle={
            matches.some((m) => m.reciprocal)
              ? "Two-way swaps first — you can teach them, they can teach you."
              : undefined
          }
          action={
            matches.length > 0 ? (
              <Button asChild variant="ghost" size="sm">
                <Link href="/matches">See all</Link>
              </Button>
            ) : undefined
          }
        />

        {matches.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {matches.map((match) => {
              const other = others.get(match.otherUid);
              if (!other) return null;
              return (
                <SwapCard
                  key={match.otherUid}
                  user={other}
                  skillsById={skillsById}
                  wants={other.skillsLearn}
                  reciprocalWith={match.reciprocal ? match.youTeach : null}
                />
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<UserRoundPlus className="size-7" aria-hidden />}
            title={needsSkills ? "Add your skills first" : "No matches yet"}
            body={
              needsSkills
                ? "Once we know what you teach and what you want to learn, we can pair you up."
                : "Nobody teaches what you're looking for yet. Try browsing everything on offer."
            }
            action={
              <Button asChild variant={needsSkills ? "learn" : "outline"}>
                <Link href={needsSkills ? "/profile/edit" : "/browse"}>
                  {needsSkills ? "Add skills" : "Browse skills"}
                </Link>
              </Button>
            }
          />
        )}
      </section>

      <Card className="mt-8 border-dashed">
        <CardBody className="flex items-start gap-3">
          <Sparkles className="mt-0.5 size-5 shrink-0 text-learn" aria-hidden />
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold">Not sure what to learn?</h3>
            <p className="mt-0.5 text-sm text-muted">
              SkillBot can suggest something based on what you already know, and find
              someone to teach it. Each session costs {COINS.sessionCost} coins.
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link href="/skillbot">Ask</Link>
          </Button>
        </CardBody>
      </Card>
    </PageContainer>
  );
}
