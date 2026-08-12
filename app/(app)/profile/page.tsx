import { PageContainer, PageHeader } from "@/components/shell/page";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Pill, SkillPill } from "@/components/ui/pill";
import { BADGES, DAY_NAMES } from "@/lib/constants";
import { requireUser } from "@/lib/firebase/admin";
import { getAwardedBadges, getSkillsMap } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { ExternalLink, Pencil, ShieldCheck, Star } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { SignOutButton } from "./sign-out-button";

export const metadata: Metadata = {
  title: "Your profile",
  robots: { index: false, follow: false },
};

export default async function ProfilePage() {
  const me = await requireUser();
  const [skillsById, awarded] = await Promise.all([
    getSkillsMap(),
    getAwardedBadges(me.uid),
  ]);
  const awardedSet = new Set(awarded);

  return (
    <PageContainer width="narrow">
      <PageHeader
        title="Your profile"
        action={
          <Button asChild variant="outline" size="sm">
            <Link href="/profile/edit">
              <Pencil className="size-4" aria-hidden />
              Edit
            </Link>
          </Button>
        }
      />

      <Card className="mb-4">
        <CardBody className="flex items-start gap-4">
          <Avatar name={me.displayName} src={me.photoURL} size="lg" />
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-xl font-semibold">{me.displayName}</h2>
            <p className="text-sm text-muted">
              @{me.username}
              {me.city ? ` · ${me.city}` : ""}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
              {me.ratingCount > 0 ? (
                <span className="flex items-center gap-1">
                  <Star className="size-3.5 fill-teach text-teach" aria-hidden />
                  <span className="tabular font-medium text-ink">
                    {me.ratingAvg.toFixed(1)}
                  </span>
                  ({me.ratingCount})
                </span>
              ) : null}
              <span>
                <span className="tabular font-medium text-ink">{me.sessionsTaught}</span> taught
              </span>
              <span>
                <span className="tabular font-medium text-ink">{me.sessionsLearned}</span>{" "}
                learned
              </span>
            </div>
            {me.bio ? <p className="mt-3 text-sm text-ink-soft">{me.bio}</p> : null}
            <Link
              href={`/u/${me.username}`}
              className="mt-3 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"
            >
              View public profile
              <ExternalLink className="size-3.5" aria-hidden />
            </Link>
          </div>
        </CardBody>
      </Card>

      <section className="mb-5">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-teach-ink">
          You can teach
        </h2>
        {me.skillsTeach.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {me.skillsTeach.map((ref) => (
              <li key={ref.skillId}>
                <SkillPill
                  name={skillsById.get(ref.skillId)?.name ?? ref.skillId}
                  level={ref.level}
                  tone="teach"
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">Nothing yet — add something so others can find you.</p>
        )}
      </section>

      <section className="mb-5">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-learn-ink">
          You want to learn
        </h2>
        {me.skillsLearn.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {me.skillsLearn.map((ref) => (
              <li key={ref.skillId}>
                <SkillPill
                  name={skillsById.get(ref.skillId)?.name ?? ref.skillId}
                  tone="learn"
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">Nothing yet — this is what we match on.</p>
        )}
      </section>

      {me.availability.length > 0 ? (
        <section className="mb-5">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted">
            You&apos;re free
          </h2>
          <ul className="flex flex-wrap gap-2">
            {me.availability.map((window, index) => (
              <li key={index}>
                <Pill tone="neutral">
                  {DAY_NAMES[window.day]} {window.start}–{window.end}
                </Pill>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mb-5">
        <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-[0.08em] text-muted">
          Badges
        </h2>
        {/* Unearned badges are shown greyed rather than hidden, so there is
            something to aim at. */}
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {BADGES.map((badge) => {
            const earned = awardedSet.has(badge.id);
            return (
              <li
                key={badge.id}
                className={cn(
                  "rounded-xl border p-3 text-center",
                  earned ? "border-teach/30 bg-teach-wash" : "border-line bg-surface opacity-55",
                )}
              >
                <span className="text-xl" aria-hidden>
                  {badge.emoji}
                </span>
                <p className="mt-1 text-sm font-medium">{badge.name}</p>
                <p className="mt-0.5 text-xs text-muted">{badge.description}</p>
              </li>
            );
          })}
        </ul>
      </section>

      <Card className="mb-5">
        <CardBody className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-medium">Guardian consent on file</p>
            <p className="mt-0.5 text-muted">
              {me.guardianConsent?.given
                ? `Given by ${me.guardianConsent.guardianName} on ${new Date(
                    me.guardianConsent.consentedAt,
                  ).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}.`
                : "Not on file. You can browse, but not book or message anyone."}
            </p>
          </div>
        </CardBody>
      </Card>

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
        <SignOutButton />
        <Link href="/privacy" className="text-sm text-muted hover:text-ink">
          Privacy
        </Link>
        <Link href="/terms" className="text-sm text-muted hover:text-ink">
          Terms
        </Link>
      </div>
    </PageContainer>
  );
}
