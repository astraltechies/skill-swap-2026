"use client";

import { isActive, PRIMARY_NAV } from "@/components/shell/nav-items";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Phone navigation. Fixed to the bottom because that is where thumbs are, and
 * padded for the iOS home indicator so the last row is never half-covered.
 */
export function BottomNav({ unreadChats = 0 }: { unreadChats?: number }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur",
        "pb-safe md:hidden",
      )}
    >
      <ul className="grid grid-cols-5">
        {PRIMARY_NAV.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 pt-1.5",
                  "text-[0.6875rem] transition-colors",
                  active ? "text-ink" : "text-muted",
                )}
              >
                <span className="relative">
                  <Icon
                    className={cn("size-5", active && "stroke-[2.25]")}
                    aria-hidden
                  />
                  {item.href === "/chat" && unreadChats > 0 ? (
                    <span
                      className="absolute -right-1.5 -top-1 flex size-4 items-center justify-center rounded-full bg-danger text-[0.5625rem] font-semibold text-white"
                      aria-label={`${unreadChats} unread`}
                    >
                      {unreadChats > 9 ? "9+" : unreadChats}
                    </span>
                  ) : null}
                </span>
                <span className={cn(active && "font-medium")}>{item.label}</span>
                {/* The active marker sits above the icon so it reads even when
                    the label is clipped on a narrow phone. */}
                <span
                  className={cn(
                    "absolute top-0 h-0.5 w-8 rounded-full transition-opacity",
                    active ? "bg-ink opacity-100" : "opacity-0",
                  )}
                  aria-hidden
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
