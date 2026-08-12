import { Logo } from "@/components/brand/logo";
import { PublicHeaderActions } from "@/components/shell/public-header-actions";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import Link from "next/link";

export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-line px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <Link href="/" className="group">
            <Logo />
          </Link>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <PublicHeaderActions />
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-line px-4 py-6 sm:px-6">
        <div className="mx-auto flex max-w-3xl flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
          <Link href="/" className="hover:text-ink">
            Home
          </Link>
          <Link href="/privacy" className="hover:text-ink">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-ink">
            Terms
          </Link>
        </div>
      </footer>
    </div>
  );
}
