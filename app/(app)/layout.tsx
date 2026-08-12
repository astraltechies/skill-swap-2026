import { AuthProvider } from "@/components/providers/auth-provider";
import { BottomNav } from "@/components/shell/bottom-nav";
import { SideNav } from "@/components/shell/side-nav";
import { TopBar } from "@/components/shell/top-bar";
import { getCurrentUser, isAdminConfigured } from "@/lib/firebase/admin";
import { redirect } from "next/navigation";
import { SetupNotice } from "./setup-notice";

/**
 * Every route in this segment is scoped to the signed-in student, so none of
 * them can be prerendered. Declaring it here rather than relying on the
 * `cookies()` call to force it matters because layouts and pages render in
 * parallel: without this, a page's data fetch runs at build time before this
 * layout's guard has had a chance to bail out.
 */
export const dynamic = "force-dynamic";

/**
 * The real authorisation gate. `proxy.ts` only redirects on a missing cookie;
 * this is where a forged or revoked cookie, or a banned account, is rejected.
 */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  if (!isAdminConfigured) return <SetupNotice />;

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <AuthProvider>
      <div className="flex min-h-dvh bg-paper">
        <SideNav isAdmin={user.role === "admin"} />

        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar user={user} />
          {/* The bottom padding clears the tab bar; it collapses on desktop
              where the tab bar is not rendered. */}
          <main className="flex-1 pb-24 md:pb-8">{children}</main>
        </div>

        <BottomNav />
      </div>
    </AuthProvider>
  );
}
