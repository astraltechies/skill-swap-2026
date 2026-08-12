"use client";

import { Logo } from "@/components/brand/logo";
import { isActive, PRIMARY_NAV, SECONDARY_NAV, type NavItem } from "@/components/shell/nav-items";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { cn } from "@/lib/utils";
import { LogOut, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "pressable group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm",
        "transition-colors duration-(--duration-fast)",
        active
          ? "bg-surface-sunk font-medium text-ink"
          : "text-ink-soft hover:bg-surface-sunk hover:text-ink",
      )}
    >
      {/* A bar on the active item, so the current section is readable at a
          glance rather than only from a subtle background tint. */}
      <span
        className={cn(
          "absolute left-0 h-5 w-0.5 rounded-full bg-ink transition-transform duration-(--duration-base) ease-(--ease-spring)",
          active ? "scale-y-100" : "scale-y-0",
        )}
        aria-hidden
      />
      <Icon
        className={cn(
          "size-[18px] shrink-0 transition-transform duration-(--duration-fast)",
          "group-hover:scale-110",
        )}
        aria-hidden
      />
      {item.label}
    </Link>
  );
}

export function SideNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line px-3 py-5 md:flex lg:w-64">
      <Link href="/dashboard" className="group mb-6 px-2">
        <Logo />
      </Link>

      <nav aria-label="Main" className="flex flex-1 flex-col gap-0.5">
        {PRIMARY_NAV.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} />
        ))}

        <hr className="my-3 border-line" />

        {SECONDARY_NAV.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} />
        ))}

        {isAdmin ? (
          <>
            <hr className="my-3 border-line" />
            <NavLink
              item={{ href: "/admin", label: "Admin", icon: ShieldAlert }}
              active={isActive(pathname, "/admin")}
            />
          </>
        ) : null}
      </nav>

      <div className="flex items-center gap-1">
        {/* A plain link to the route handler rather than the client sign-out
            helper: importing that pulled the whole Firebase Auth SDK into every
            signed-in page for a button used once a session. /logout clears the
            cookie and revokes the refresh token server-side, which is stronger
            than the client-only path was anyway. */}
        <Link
          href="/logout"
          prefetch={false}
          className="pressable flex flex-1 items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted transition-colors duration-(--duration-fast) hover:bg-surface-sunk hover:text-ink"
        >
          <LogOut className="size-[18px]" aria-hidden />
          Sign out
        </Link>

        <ThemeToggle />
      </div>
    </aside>
  );
}
