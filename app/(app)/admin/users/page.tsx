import { PageContainer, PageHeader } from "@/components/shell/page";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardBody } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { getAllUsers } from "@/lib/admin/queries";
import { getSkillsMap } from "@/lib/queries";
import type { UserStatus } from "@/types/firestore";
import { Flag } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Students",
  robots: { index: false, follow: false },
};

const STATUS_TONE: Record<UserStatus, "success" | "danger" | "neutral"> = {
  active: "success",
  under_review: "danger",
  suspended: "danger",
  banned: "danger",
};

const STATUS_LABEL: Record<UserStatus, string> = {
  active: "Active",
  under_review: "Under review",
  suspended: "Suspended",
  banned: "Banned",
};

export default async function AdminUsersPage() {
  const [users, skillsById] = await Promise.all([getAllUsers(), getSkillsMap()]);

  return (
    <PageContainer width="wide">
      <PageHeader
        title="Students"
        subtitle={`${users.length} accounts · flagged accounts listed first`}
      />

      <Card>
        <CardBody className="p-0 sm:p-0">
          <ul className="divide-y divide-line">
            {users.map((user) => (
              <li key={user.uid} className="flex items-center gap-3 px-4 py-3">
                <Avatar name={user.displayName} src={user.photoURL} size="sm" />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <Link
                      href={`/u/${user.username}`}
                      className="truncate font-medium underline-offset-2 hover:underline"
                    >
                      {user.displayName}
                    </Link>
                    {user.role === "admin" ? <Pill tone="learn">Admin</Pill> : null}
                    {user.status !== "active" ? (
                      <Pill tone={STATUS_TONE[user.status]}>{STATUS_LABEL[user.status]}</Pill>
                    ) : null}
                    {user.reportCount > 0 ? (
                      <Pill tone="danger">
                        <Flag className="size-3" aria-hidden />
                        {user.reportCount}
                      </Pill>
                    ) : null}
                    {!user.guardianConsent?.given ? (
                      <Pill tone="danger">No consent</Pill>
                    ) : null}
                  </div>
                  <p className="truncate text-sm text-muted">
                    @{user.username}
                    {user.city ? ` · ${user.city}` : ""}
                    {user.skillsTeach.length > 0
                      ? ` · teaches ${user.skillsTeach
                          .slice(0, 2)
                          .map((s) => skillsById.get(s.skillId)?.name ?? s.skillId)
                          .join(", ")}`
                      : ""}
                  </p>
                </div>

                <div className="hidden shrink-0 gap-5 text-right text-sm sm:flex">
                  <span>
                    <span className="tabular block font-medium">{user.sessionsTaught}</span>
                    <span className="text-xs text-muted">taught</span>
                  </span>
                  <span>
                    <span className="tabular block font-medium">{user.coinBalance}</span>
                    <span className="text-xs text-muted">coins</span>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>

      <p className="mt-4 text-sm text-muted">
        To suspend or ban an account, act on a report in the{" "}
        <Link href="/admin/reports" className="underline underline-offset-2">
          moderation queue
        </Link>
        . That path records the reason in the audit log.
      </p>
    </PageContainer>
  );
}
