import { PageContainer, PageHeader } from "@/components/shell/page";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { getAdminStats } from "@/lib/admin/queries";
import { getSkillsMap } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { AlertTriangle, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Admin overview",
  robots: { index: false, follow: false },
};

function Stat({
  label,
  value,
  tone = "neutral",
  hint,
}: {
  label: string;
  value: number | string;
  tone?: "neutral" | "danger" | "teach" | "learn";
  hint?: string;
}) {
  return (
    <Card>
      <CardBody className="py-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
        <p
          className={cn(
            "tabular mt-1 text-2xl font-semibold",
            tone === "danger" && "text-danger",
            tone === "teach" && "text-teach-ink",
            tone === "learn" && "text-learn-ink",
          )}
        >
          {value}
        </p>
        {hint ? <p className="mt-0.5 text-xs text-muted">{hint}</p> : null}
      </CardBody>
    </Card>
  );
}

export default async function AdminOverviewPage() {
  const [stats, skillsById] = await Promise.all([getAdminStats(), getSkillsMap()]);

  return (
    <PageContainer width="wide">
      <PageHeader title="Overview" />

      {/* Anything needing a human goes first, before the vanity numbers. */}
      {stats.highPriorityReports > 0 || stats.underReview > 0 ? (
        <Card className="mb-5 border-danger/40 bg-danger-wash">
          <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-danger" aria-hidden />
              <div>
                <h2 className="font-display font-semibold text-danger">Needs attention</h2>
                <p className="mt-0.5 text-sm text-ink-soft">
                  {stats.highPriorityReports > 0
                    ? `${stats.highPriorityReports} safety ${stats.highPriorityReports === 1 ? "report" : "reports"} waiting`
                    : ""}
                  {stats.highPriorityReports > 0 && stats.underReview > 0 ? " · " : ""}
                  {stats.underReview > 0
                    ? `${stats.underReview} ${stats.underReview === 1 ? "account" : "accounts"} auto-flagged`
                    : ""}
                </p>
              </div>
            </div>
            <Button asChild variant="danger" className="shrink-0">
              <Link href="/admin/reports">
                Open queue
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </CardBody>
        </Card>
      ) : null}

      <section className="mb-6">
        <h2 className="mb-3 font-display text-lg font-semibold">Students</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Total" value={stats.totalStudents} />
          <Stat label="Active" value={stats.activeStudents} />
          <Stat
            label="Under review"
            value={stats.underReview}
            tone={stats.underReview > 0 ? "danger" : "neutral"}
          />
          <Stat label="New this week" value={stats.signupsLast7Days} />
        </div>
      </section>

      <section className="mb-6">
        <h2 className="mb-3 font-display text-lg font-semibold">Sessions</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Booked, all time" value={stats.totalSessions} />
          <Stat label="Completed" value={stats.completedSessions} tone="teach" />
          <Stat label="Upcoming" value={stats.upcomingSessions} tone="learn" />
          <Stat
            label="Coins in circulation"
            value={stats.coinsInCirculation}
            hint="Total balance across all students"
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg font-semibold">Most-taught skills</h2>
        {stats.topSkills.length > 0 ? (
          <Card>
            <CardBody>
              <ul className="space-y-2.5">
                {stats.topSkills.map(({ skillId, teachers }) => {
                  const max = stats.topSkills[0].teachers || 1;
                  return (
                    <li key={skillId} className="flex items-center gap-3">
                      <span className="w-32 shrink-0 truncate text-sm sm:w-44">
                        {skillsById.get(skillId)?.name ?? skillId}
                      </span>
                      {/* A plain bar rather than a chart library — one metric,
                          one dimension, no axes needed. */}
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-sunk">
                        <span
                          className="block h-full rounded-full bg-teach"
                          style={{ width: `${(teachers / max) * 100}%` }}
                        />
                      </span>
                      <span className="tabular w-8 shrink-0 text-right text-sm text-muted">
                        {teachers}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </CardBody>
          </Card>
        ) : (
          <p className="text-sm text-muted">No skills listed yet.</p>
        )}
      </section>

      <p className="mt-6 flex items-center gap-2 text-xs text-muted">
        <Pill tone="neutral">Note</Pill>
        Every admin action is written to an audit log with who did it and when.
      </p>
    </PageContainer>
  );
}
