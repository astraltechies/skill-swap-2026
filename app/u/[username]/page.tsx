import { BookDialog } from "@/components/booking/book-dialog";
import { Logo } from "@/components/brand/logo";
import { BlockButton } from "@/components/safety/block-button";
import { ReportDialog } from "@/components/safety/report-dialog";
import { JsonLd } from "@/components/seo/json-ld";
import { PageContainer } from "@/components/shell/page";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Pill, SkillPill } from "@/components/ui/pill";
import { BADGE_BY_ID } from "@/lib/constants";
import { getCurrentUser } from "@/lib/firebase/admin";
import {
  getAwardedBadges,
  getBlockedIds,
  getRatingsFor,
  getSkillsMap,
  getUserByUsername,
} from "@/lib/queries";
import { breadcrumbSchema, personSchema, siteUrl } from "@/lib/seo/structured-data";
import { timeAgo } from "@/lib/utils";
import { Star, Video } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

/**
 * Rendered per request rather than cached: the page reads the session cookie so
 * a signed-in visitor gets the booking and block controls inline. Crawlers
 * still receive fully rendered HTML with the metadata and JSON-LD below, which
 * is what indexing actually needs — caching here would be a cost optimisation,
 * not an SEO one, and it cannot coexist with reading cookies.
 */

export async function generateMetadata({
  params,
}: PageProps<"/u/[username]">): Promise<Metadata> {
  const { username } = await params;
  const user = await getUserByUsername(username);
  if (!user) return { title: "Profile not found" };

  const skillsById = await getSkillsMap();
  const teaches = user.skillsTeach
    .map((s) => skillsById.get(s.skillId)?.name)
    .filter(Boolean)
    .join(", ");

  const title = `${user.displayName} teaches ${teaches || "on Skill Swap"}`;
  const description =
    user.bio ||
    `${user.displayName} is a student on Skill Swap${teaches ? ` teaching ${teaches}` : ""}. Swap skills with them — teach what you know, learn what you don't.`;

  return {
    title,
    description,
    alternates: { canonical: siteUrl(`/u/${user.username}`) },
    openGraph: { title, description, url: siteUrl(`/u/${user.username}`), type: "profile" },
  };
}

export default async function PublicProfilePage({ params }: PageProps<"/u/[username]">) {
  const { username } = await params;

  // Who is being viewed, who is viewing, and the catalogue are three unrelated
  // lookups — resolving the profile first made the other two wait on it.
  const [user, viewer, skillsById] = await Promise.all([
    getUserByUsername(username),
    getCurrentUser(),
    getSkillsMap(),
  ]);

  if (!user) notFound();

  const [ratings, badgeIds] = await Promise.all([
    getRatingsFor(user.uid),
    getAwardedBadges(user.uid),
  ]);

  const isOwnProfile = viewer?.uid === user.uid;
  const blocked = viewer ? await getBlockedIds(viewer.uid) : new Set<string>();
  const skillNames = user.skillsTeach
    .map((s) => skillsById.get(s.skillId)?.name)
    .filter((n): n is string => Boolean(n));

  return (
    <>
      <JsonLd data={personSchema(user, skillNames)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Skill Swap", path: "/" },
          { name: user.displayName, path: `/u/${user.username}` },
        ])}
      />

      {/* This page sits outside the app shell — signed-out visitors arrive here
          straight from search — so it carries its own header. It renders for
          signed-in viewers too, who would otherwise land on a profile with no
          navigation and no way back. The page is dynamic, so the viewer is
          known server-side and the right controls render immediately. */}
      <header className="border-b border-line px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
          <Link href={viewer ? "/dashboard" : "/"} className="group">
            <Logo />
          </Link>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            {viewer ? (
              <Button asChild variant="outline" size="sm">
                <Link href="/browse">Browse</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/signup">Join</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <PageContainer>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start">
          <Avatar name={user.displayName} src={user.photoURL} size="xl" className="shrink-0" />

          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              {user.displayName}
            </h1>
            <p className="mt-0.5 text-muted">
              @{user.username}
              {user.city ? ` · ${user.city}` : ""}
            </p>

            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
              {user.ratingCount > 0 ? (
                <span className="flex items-center gap-1.5">
                  <Star className="size-4 fill-teach text-teach" aria-hidden />
                  <span className="tabular font-medium">{user.ratingAvg.toFixed(1)}</span>
                  <span className="text-muted">({user.ratingCount})</span>
                </span>
              ) : (
                <Pill tone="neutral">New here</Pill>
              )}
              <span className="text-muted">
                <span className="tabular font-medium text-ink">{user.sessionsTaught}</span>{" "}
                taught
              </span>
              <span className="text-muted">
                <span className="tabular font-medium text-ink">{user.sessionsLearned}</span>{" "}
                learned
              </span>
            </div>

            {user.bio ? (
              <p className="mt-3 leading-relaxed text-ink-soft">{user.bio}</p>
            ) : null}
          </div>
        </div>

        {badgeIds.length > 0 ? (
          <ul className="mb-6 flex flex-wrap gap-2">
            {badgeIds.map((id) => {
              const badge = BADGE_BY_ID.get(id);
              if (!badge) return null;
              return (
                <li key={id}>
                  <Pill tone="neutral" className="gap-1.5">
                    <span aria-hidden>{badge.emoji}</span>
                    <span>{badge.name}</span>
                  </Pill>
                </li>
              );
            })}
          </ul>
        ) : null}

        <section className="mb-6">
          <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-[0.08em] text-teach-ink">
            Can teach
          </h2>
          {user.skillsTeach.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {user.skillsTeach.map((ref) => (
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
            <p className="text-sm text-muted">Not teaching anything yet.</p>
          )}
        </section>

        {user.skillsLearn.length > 0 ? (
          <section className="mb-6">
            <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-[0.08em] text-learn-ink">
              Wants to learn
            </h2>
            <ul className="flex flex-wrap gap-2">
              {user.skillsLearn.map((ref) => (
                <li key={ref.skillId}>
                  <SkillPill
                    name={skillsById.get(ref.skillId)?.name ?? ref.skillId}
                    tone="learn"
                  />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="mb-8 flex flex-wrap items-center gap-3 border-y border-line py-4">
          {isOwnProfile ? (
            <Button asChild variant="outline">
              <Link href="/profile/edit">Edit your profile</Link>
            </Button>
          ) : viewer ? (
            <>
              <BookDialog
                teacherId={user.uid}
                teacherName={user.displayName.split(" ")[0]}
                teaches={user.skillsTeach}
                skillsById={skillsById}
                myBalance={viewer.coinBalance}
                canBook={Boolean(viewer.guardianConsent?.given)}
              />
              <ReportDialog
                reportedUserId={user.uid}
                reportedName={user.displayName.split(" ")[0]}
                contentType="profile"
              />
              <BlockButton
                targetUid={user.uid}
                targetName={user.displayName.split(" ")[0]}
                initiallyBlocked={blocked.has(user.uid)}
              />
            </>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button asChild variant="learn" size="lg">
                <Link href="/signup">Join to book a session</Link>
              </Button>
              <p className="flex items-center gap-1.5 text-sm text-muted">
                <Video className="size-3.5" aria-hidden />
                Sessions run on video, with guardian consent.
              </p>
            </div>
          )}
        </div>

        {ratings.length > 0 ? (
          <section>
            <h2 className="mb-3 font-display text-lg font-semibold">
              What students said
            </h2>
            <ul className="space-y-2.5">
              {ratings.map((rating) => (
                <li key={rating.id}>
                  <Card>
                    <CardBody>
                      <div className="mb-1.5 flex items-center gap-2">
                        <span className="flex" aria-label={`${rating.stars} out of 5`}>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star
                              key={n}
                              className={
                                n <= rating.stars
                                  ? "size-3.5 fill-teach text-teach"
                                  : "size-3.5 text-line-strong"
                              }
                              aria-hidden
                            />
                          ))}
                        </span>
                        <span className="text-xs text-muted">{timeAgo(rating.createdAt)}</span>
                      </div>
                      {rating.comment ? (
                        <p className="text-sm text-ink-soft">{rating.comment}</p>
                      ) : (
                        <p className="text-sm italic text-muted">No comment left.</p>
                      )}
                    </CardBody>
                  </Card>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </PageContainer>
    </>
  );
}
