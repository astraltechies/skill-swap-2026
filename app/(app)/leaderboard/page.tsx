import { PageContainer, PageHeader } from "@/components/shell/page";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/card";
import { requireUser } from "@/lib/firebase/admin";
import { getTeachingUsers } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { Star, Trophy } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Leaderboard",
  robots: { index: false, follow: false },
};

const MEDAL = ["text-teach-ink bg-teach-wash", "text-ink-soft bg-surface-sunk", "text-teach-ink bg-teach-wash/60"];

export default async function LeaderboardPage() {
  const me = await requireUser();
  const teachers = (await getTeachingUsers())
    .filter((u) => u.sessionsTaught > 0)
    .sort((a, b) => b.sessionsTaught - a.sessionsTaught || b.ratingAvg - a.ratingAvg)
    .slice(0, 50);

  const myRank = teachers.findIndex((t) => t.uid === me.uid);

  return (
    <PageContainer width="narrow">
      <PageHeader title="Leaderboard" subtitle="Ranked by sessions taught." />

      {teachers.length > 0 ? (
        <>
          <ol className="space-y-2">
            {teachers.map((teacher, index) => (
              <li key={teacher.uid}>
                <Link
                  href={`/u/${teacher.username}`}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border p-3 transition-colors hover:bg-surface-sunk",
                    teacher.uid === me.uid
                      ? "border-learn/40 bg-learn-wash"
                      : "border-line bg-surface",
                  )}
                >
                  <span
                    className={cn(
                      "tabular flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                      index < 3 ? MEDAL[index] : "text-muted",
                    )}
                  >
                    {index + 1}
                  </span>
                  <Avatar name={teacher.displayName} src={teacher.photoURL} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {teacher.displayName}
                      {teacher.uid === me.uid ? " (you)" : ""}
                    </p>
                    {teacher.ratingCount > 0 ? (
                      <p className="flex items-center gap-1 text-xs text-muted">
                        <Star className="size-3 fill-teach text-teach" aria-hidden />
                        <span className="tabular">{teacher.ratingAvg.toFixed(1)}</span>
                      </p>
                    ) : null}
                  </div>
                  <span className="tabular shrink-0 text-sm font-semibold text-teach-ink">
                    {teacher.sessionsTaught}
                  </span>
                </Link>
              </li>
            ))}
          </ol>

          {myRank === -1 ? (
            <p className="mt-4 text-center text-sm text-muted">
              Teach a session to appear on the board.
            </p>
          ) : null}
        </>
      ) : (
        <EmptyState
          icon={<Trophy className="size-7" aria-hidden />}
          title="No teachers yet"
          body="Be the first to teach a session and top the board."
        />
      )}
    </PageContainer>
  );
}
