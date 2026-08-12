import { Avatar } from "@/components/ui/avatar";
import { Pill, SkillPill } from "@/components/ui/pill";
import { cn } from "@/lib/utils";
import type { PublicUserProfile, Skill, SkillRef } from "@/types/firestore";
import { ArrowLeftRight, Star } from "lucide-react";
import Link from "next/link";

/**
 * The signature element.
 *
 * A card torn along a seam: above it, in amber, what this person can teach;
 * below it, in indigo, what they are looking for. The whole product is that
 * one idea, so it gets the one piece of visual weight — everything around it
 * stays quiet.
 */
export function SwapCard({
  user,
  skillsById,
  wants,
  reciprocalWith,
  className,
}: {
  user: PublicUserProfile;
  skillsById: Map<string, Skill>;
  /** What they want to learn. Public profiles omit this, so it's optional. */
  wants?: SkillRef[];
  /** When set, the skill *you* could teach them — marks a true two-way swap. */
  reciprocalWith?: string | null;
  className?: string;
}) {
  const teaches = user.skillsTeach.slice(0, 4);
  const learns = (wants ?? []).slice(0, 3);
  const nameOf = (id: string) => skillsById.get(id)?.name ?? "a skill";

  return (
    <article
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-2xl border border-line bg-surface shadow-sm",
        // The signature element, so it gets the most considered motion: a small
        // lift, a warming border, and the seam notches easing apart — the card
        // reading as two halves about to separate is the whole product idea.
        "transition-[box-shadow,border-color,transform] duration-(--duration-fast) ease-(--ease-out-quart)",
        "hover:-translate-y-0.5 hover:border-line-strong hover:shadow-md",
        "active:translate-y-0 active:scale-[0.995]",
        "focus-within:ring-2 focus-within:ring-learn/30",
        className,
      )}
    >
      {reciprocalWith ? (
        <div className="flex items-center gap-1.5 border-b border-line bg-surface-sunk px-4 py-1.5 text-xs font-medium text-ink-soft">
          <ArrowLeftRight className="size-3.5 text-learn" aria-hidden />
          <span>
            Two-way swap — they want{" "}
            <span className="text-ink">{nameOf(reciprocalWith)}</span>
          </span>
        </div>
      ) : null}

      <header className="flex items-start gap-3 px-4 pt-4">
        <Avatar name={user.displayName} src={user.photoURL} size="md" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-base font-semibold leading-tight">
            {/* Stretched link keeps the whole card tappable on a phone without
                nesting the inner skill links inside an anchor. */}
            <Link
              href={`/u/${user.username}`}
              className="after:absolute after:inset-0 after:content-['']"
            >
              {user.displayName}
            </Link>
          </h3>
          <p className="truncate text-sm text-muted">
            @{user.username}
            {user.city ? ` · ${user.city}` : ""}
          </p>
        </div>
        {user.ratingCount > 0 ? (
          <span className="flex shrink-0 items-center gap-1 text-sm">
            <Star className="size-3.5 fill-teach text-teach" aria-hidden />
            <span className="tabular font-medium">{user.ratingAvg.toFixed(1)}</span>
            <span className="sr-only">out of 5, from {user.ratingCount} reviews</span>
          </span>
        ) : (
          <Pill tone="neutral" className="shrink-0">
            New
          </Pill>
        )}
      </header>

      <div className="px-4 pb-4 pt-3">
        <p className="mb-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-teach-ink">
          Can teach
        </p>
        <ul className="flex flex-wrap gap-1.5">
          {teaches.map((s) => (
            <li key={s.skillId}>
              <SkillPill name={nameOf(s.skillId)} level={s.level} tone="teach" />
            </li>
          ))}
          {user.skillsTeach.length > teaches.length ? (
            <li>
              <Pill tone="neutral">+{user.skillsTeach.length - teaches.length}</Pill>
            </li>
          ) : null}
        </ul>
      </div>

      {learns.length > 0 ? (
        <>
          <div className="swap-notch">
            <div className="swap-seam mx-4" />
          </div>
          <div className="px-4 pb-4 pt-3">
            <p className="mb-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-learn-ink">
              Wants to learn
            </p>
            <ul className="flex flex-wrap gap-1.5">
              {learns.map((s) => (
                <li key={s.skillId}>
                  <SkillPill name={nameOf(s.skillId)} tone="learn" />
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : null}
    </article>
  );
}
