"use client";

import { Logo } from "@/components/brand/logo";
import { isActive, PRIMARY_NAV, SECONDARY_NAV, type NavItem } from "@/components/shell/nav-items";
import { signOut } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";
import { LogOut, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
        active
          ? "bg-surface-sunk font-medium text-ink"
          : "text-ink-soft hover:bg-surface-sunk hover:text-ink",
      )}
    >
      <Icon className="size-[18px] shrink-0" aria-hidden />
      {item.label}
    </Link>
  );
}

export function SideNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line px-3 py-5 md:flex lg:w-64">
      <Link href="/dashboard" className="mb-6 px-2">
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

      <button
        type="button"
        onClick={handleSignOut}
        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted transition-colors hover:bg-surface-sunk hover:text-ink"
      >
        <LogOut className="size-[18px]" aria-hidden />
        Sign out
      </button>
    </aside>
  );
}
