import { BottomNav } from "@/components/shell/bottom-nav";
import { SideNav } from "@/components/shell/side-nav";
import { TopBar } from "@/components/shell/top-bar";
import { getCurrentUser, isAdminConfigured } from "@/lib/firebase/admin";
import { getUnreadCount } from "@/lib/queries";
import { redirect } from "next/navigation";
import { SetupNotice } from "./setup-notice";
import { SuspendedNotice } from "./suspended-notice";

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

  // Via /logout, not /login: the cookie may be present but no longer valid
  // (revoked by a ban, or simply expired), and only a Route Handler can clear
  // it. Sending them to /login directly would bounce off `proxy.ts` forever.
  if (!user) redirect("/logout?reason=expired");

  // A suspended account resolves fine here but throws in `requireUser()`, so
  // without this branch it would render the whole shell and then crash every
  // page into the generic error screen.
  if (user.status === "suspended") return <SuspendedNotice />;

  const unread = await getUnreadCount(user.uid);

  return (
    <div className="flex min-h-dvh bg-paper">
      <SideNav isAdmin={user.role === "admin"} unread={unread} />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar user={user} unread={unread} />
        {/* The bottom padding clears the tab bar; it collapses on desktop
            where the tab bar is not rendered. */}
        <main className="flex-1 pb-24 md:pb-8">{children}</main>
      </div>

      <BottomNav />
    </div>
  );
}
