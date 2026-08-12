import { PageContainer, PageHeader } from "@/components/shell/page";
import { SwapCard } from "@/components/swap/swap-card";
import { Button } from "@/components/ui/button";
import { EmptyState, SectionHeading } from "@/components/ui/card";
import { requireUser } from "@/lib/firebase/admin";
import { findMatches } from "@/lib/matching/score";
import { getBlockedIds, getSkillsMap, getTeachingUsers, getUsersByIds } from "@/lib/queries";
import { ArrowLeftRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Your matches",
  robots: { index: false, follow: false },
};

export default async function MatchesPage() {
  // Only the blocklist needs the uid; the catalogue and candidate pool don't.
  const [me, skillsById, candidates] = await Promise.all([
    requireUser(),
    getSkillsMap(),
    getTeachingUsers(),
  ]);

  const blocked = await getBlockedIds(me.uid);

  const matches = findMatches(me, candidates, { limit: 30, excludeUids: blocked });
  const others = await getUsersByIds(matches.map((m) => m.otherUid));

  const twoWay = matches.filter((m) => m.reciprocal);
  const oneWay = matches.filter((m) => !m.reciprocal);

  return (
    <PageContainer width="wide">
      <PageHeader
        title="Your matches"
        subtitle="Ranked by how well the swap works, not by who joined most recently."
      />

      {matches.length === 0 ? (
        <EmptyState
          icon={<ArrowLeftRight className="size-7" aria-hidden />}
          title="No matches yet"
          body={
            me.skillsLearn.length === 0
              ? "Add something you want to learn and we can start pairing you up."
              : "Nobody teaches what you're after yet. Browsing everything on offer might turn something up."
          }
          action={
            <Button asChild variant="learn">
              <Link href={me.skillsLearn.length === 0 ? "/profile/edit" : "/browse"}>
                {me.skillsLearn.length === 0 ? "Add skills" : "Browse skills"}
              </Link>
            </Button>
          }
        />
      ) : (
        <>
          {twoWay.length > 0 ? (
            <section className="mb-8">
              <SectionHeading
                title="Two-way swaps"
                subtitle="You can teach them something, and they can teach you something."
              />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {twoWay.map((match) => {
                  const other = others.get(match.otherUid);
                  if (!other) return null;
                  return (
                    <SwapCard
                      key={match.otherUid}
                      user={other}
                      skillsById={skillsById}
                      wants={other.skillsLearn}
                      reciprocalWith={match.youTeach}
                    />
                  );
                })}
              </div>
            </section>
          ) : null}

          {oneWay.length > 0 ? (
            <section>
              <SectionHeading
                title="They can teach you"
                subtitle="One-way for now — add more skills you can teach to turn these into swaps."
              />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {oneWay.map((match) => {
                  const other = others.get(match.otherUid);
                  if (!other) return null;
                  return (
                    <SwapCard
                      key={match.otherUid}
                      user={other}
                      skillsById={skillsById}
                      wants={other.skillsLearn}
                    />
                  );
                })}
              </div>
            </section>
          ) : null}
        </>
      )}
    </PageContainer>
  );
}
