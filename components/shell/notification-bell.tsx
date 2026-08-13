import { cn } from "@/lib/utils";
import { Bell } from "lucide-react";
import Link from "next/link";

/**
 * The bell, with its unread count.
 *
 * A link rather than a dropdown: on a phone a popover of notifications is a
 * cramped scroll area inside another scroll area, and every one of these leads
 * somewhere anyway. Sending people to a real page keeps the back button
 * meaningful.
 */
export function NotificationBell({
  unread,
  className,
}: {
  unread: number;
  className?: string;
}) {
  return (
    <Link
      href="/notifications"
      aria-label={
        unread > 0
          ? `Notifications, ${unread} unread`
          : "Notifications"
      }
      className={cn(
        "pressable relative flex size-9 items-center justify-center rounded-xl",
        "text-muted transition-colors duration-(--duration-fast)",
        "hover:bg-surface-sunk hover:text-ink",
        className,
      )}
    >
      <Bell className="size-[18px]" aria-hidden />
      {unread > 0 ? (
        <span
          className={cn(
            "absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full",
            "bg-danger px-1 text-[0.5625rem] font-semibold leading-4 text-white",
            "motion-safe:animate-(--animate-scale-in)",
          )}
          aria-hidden
        >
          {unread > 9 ? "9+" : unread}
        </span>
      ) : null}
    </Link>
  );
}
