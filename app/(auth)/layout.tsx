import { Logo } from "@/components/brand/logo";
import { AuthProvider } from "@/components/providers/auth-provider";
import Link from "next/link";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <AuthProvider>
      <div className="flex min-h-dvh flex-col bg-paper">
        <header className="px-4 pt-6 sm:px-6">
          <Link href="/" className="inline-block">
            <Logo />
          </Link>
        </header>

        <main className="flex flex-1 flex-col justify-center px-4 py-8 sm:px-6">
          <div className="mx-auto w-full max-w-md">{children}</div>
        </main>

        <footer className="px-4 pb-safe pt-4 text-center text-xs text-muted sm:px-6">
          <Link href="/privacy" className="underline-offset-2 hover:underline">
            Privacy
          </Link>
          <span className="mx-2" aria-hidden>
            ·
          </span>
          <Link href="/terms" className="underline-offset-2 hover:underline">
            Terms
          </Link>
        </footer>
      </div>
    </AuthProvider>
  );
}
