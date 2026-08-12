import { PageContainer, PageHeader } from "@/components/shell/page";
import { EmptyState, SectionHeading } from "@/components/ui/card";
import { getReportQueue, getResolvedReports } from "@/lib/admin/queries";
import { getUsersByIds } from "@/lib/queries";
import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { ReportCard } from "./report-card";

export const metadata: Metadata = {
  title: "Moderation queue",
  robots: { index: false, follow: false },
};

export default async function AdminReportsPage() {
  const [queue, resolved] = await Promise.all([getReportQueue(), getResolvedReports()]);

  const users = await getUsersByIds([
    ...queue.flatMap((r) => [r.reporterId, r.reportedUserId]),
    ...resolved.flatMap((r) => [r.reporterId, r.reportedUserId]),
  ]);

  const highPriority = queue.filter((r) => r.priority === "high");
  const normal = queue.filter((r) => r.priority === "normal");

  return (
    <PageContainer>
      <PageHeader
        title="Moderation queue"
        subtitle={
          queue.length === 0
            ? "Nothing waiting."
            : `${queue.length} open · oldest first within each priority`
        }
      />

      {queue.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="size-7" aria-hidden />}
          title="Queue is clear"
          body="No open reports. Safety reports will appear here first when they arrive."
        />
      ) : (
        <>
          {highPriority.length > 0 ? (
            <section className="mb-8">
              <SectionHeading
                title="Safety first"
                subtitle="Safety concerns and harassment are escalated automatically."
              />
              <ul className="space-y-3">
                {highPriority.map((report) => (
                  <ReportCard
                    key={report.id}
                    report={report}
                    reporter={users.get(report.reporterId)}
                    reported={users.get(report.reportedUserId)}
                  />
                ))}
              </ul>
            </section>
          ) : null}

          {normal.length > 0 ? (
            <section>
              <SectionHeading title="Everything else" />
              <ul className="space-y-3">
                {normal.map((report) => (
                  <ReportCard
                    key={report.id}
                    report={report}
                    reporter={users.get(report.reporterId)}
                    reported={users.get(report.reportedUserId)}
                  />
                ))}
              </ul>
            </section>
          ) : null}
        </>
      )}

      {resolved.length > 0 ? (
        <section className="mt-10">
          <SectionHeading title="Recently closed" />
          <ul className="space-y-3">
            {resolved.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                reporter={users.get(report.reporterId)}
                reported={users.get(report.reportedUserId)}
                readOnly
              />
            ))}
          </ul>
        </section>
      ) : null}
    </PageContainer>
  );
}
