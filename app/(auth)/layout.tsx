import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import Link from "next/link";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <header className="flex items-center justify-between px-4 pt-6 sm:px-6">
        <Link href="/" className="group inline-block">
          <Logo />
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex flex-1 flex-col justify-center px-4 py-8 sm:px-6">
        <div className="mx-auto w-full max-w-md">{children}</div>
      </main>

      <footer className="px-4 pb-safe pt-4 text-center text-xs text-muted sm:px-6">
        <Link
          href="/privacy"
          className="underline-offset-2 transition-colors duration-(--duration-fast) hover:text-ink hover:underline"
        >
          Privacy
        </Link>
        <span className="mx-2" aria-hidden>
          ·
        </span>
        <Link
          href="/terms"
          className="underline-offset-2 transition-colors duration-(--duration-fast) hover:text-ink hover:underline"
        >
          Terms
        </Link>
      </footer>
    </div>
  );
}
