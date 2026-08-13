import { MarkAllRead } from "@/app/(app)/notifications/mark-all-read";
import { PageContainer, PageHeader } from "@/components/shell/page";
import { Card, CardBody, EmptyState } from "@/components/ui/card";
import { requireUser } from "@/lib/firebase/admin";
import { getNotifications } from "@/lib/queries";
import { cn, timeAgo } from "@/lib/utils";
import type { Notification } from "@/types/firestore";
import {
  Award,
  Bell,
  CalendarCheck,
  CalendarClock,
  CalendarX,
  Check,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Notifications",
  robots: { index: false, follow: false },
};

const ICON: Record<Notification["type"], LucideIcon> = {
  booking_request: CalendarClock,
  booking_accepted: CalendarCheck,
  booking_declined: CalendarX,
  session_reminder: CalendarClock,
  session_completed: Check,
  new_message: MessageSquare,
  badge_earned: Award,
};

/** Amber for anything you earned, indigo for anything asked of you. */
const TONE: Record<Notification["type"], string> = {
  booking_request: "bg-learn-wash text-learn-ink",
  booking_accepted: "bg-teach-wash text-teach-ink",
  booking_declined: "bg-surface-sunk text-muted",
  session_reminder: "bg-learn-wash text-learn-ink",
  session_completed: "bg-teach-wash text-teach-ink",
  new_message: "bg-learn-wash text-learn-ink",
  badge_earned: "bg-teach-wash text-teach-ink",
};

export default async function NotificationsPage() {
  const me = await requireUser();
  const notifications = await getNotifications(me.uid);
  const unread = notifications.filter((n) => !n.read);

  return (
    <PageContainer width="narrow">
      <PageHeader
        title="Notifications"
        subtitle={
          unread.length > 0
            ? `${unread.length} unread`
            : notifications.length > 0
              ? "You're all caught up."
              : undefined
        }
        action={
          unread.length > 0 ? <MarkAllRead ids={unread.map((n) => n.id)} /> : undefined
        }
      />

      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="size-7" aria-hidden />}
          title="Nothing yet"
          body="When someone asks you to teach them, replies to a request, or you earn a badge, it'll show up here."
        />
      ) : (
        <ul className="space-y-2">
          {notifications.map((n) => {
            const Icon = ICON[n.type] ?? Bell;
            return (
              <li key={n.id}>
                <Link
                  href={n.href}
                  className={cn(
                    "pressable flex items-start gap-3 rounded-2xl border p-3.5",
                    "transition-colors duration-(--duration-fast) hover:bg-surface-sunk",
                    // Unread carries a tinted ground rather than only a dot, so
                    // the difference survives a glance on a bright phone screen.
                    n.read
                      ? "border-line bg-surface"
                      : "border-learn/30 bg-learn-wash/40",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-full",
                      TONE[n.type] ?? "bg-surface-sunk text-muted",
                    )}
                  >
                    <Icon className="size-4" aria-hidden />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className={cn("truncate", !n.read && "font-medium")}>
                        {n.title}
                      </span>
                      <span className="shrink-0 text-xs text-muted">
                        {timeAgo(n.createdAt)}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-sm text-muted">{n.body}</span>
                  </span>

                  {!n.read ? (
                    <span
                      className="mt-1.5 size-2 shrink-0 rounded-full bg-learn"
                      aria-label="Unread"
                    />
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {notifications.length > 0 ? (
        <Card className="mt-6 border-dashed">
          <CardBody>
            <p className="text-sm text-muted">
              Only the last 30 are kept here. Your sessions and messages are always
              available in full from the tabs below.
            </p>
          </CardBody>
        </Card>
      ) : null}
    </PageContainer>
  );
}
