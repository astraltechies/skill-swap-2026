import { requireAdmin } from "@/lib/firebase/admin";
import { cn } from "@/lib/utils";
import { LayoutDashboard, ShieldAlert, Users } from "lucide-react";
import Link from "next/link";

const ADMIN_NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/reports", label: "Reports", icon: ShieldAlert },
  { href: "/admin/users", label: "Students", icon: Users },
];

/**
 * `requireAdmin` throws for a non-admin, which surfaces as the error boundary
 * rather than a redirect — an account that is not an admin should not be told
 * where the admin area is.
 */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();

  return (
    <div>
      <div className="border-b border-line bg-surface px-4 pt-4 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-danger">
            <ShieldAlert className="size-3.5" aria-hidden />
            Admin
          </p>
          <nav className="flex gap-1 overflow-x-auto no-scrollbar">
            {ADMIN_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-t-lg px-3 py-2.5 text-sm",
                  "text-ink-soft transition-colors hover:bg-surface-sunk hover:text-ink",
                )}
              >
                <item.icon className="size-4" aria-hidden />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
      {children}
    </div>
  );
}
