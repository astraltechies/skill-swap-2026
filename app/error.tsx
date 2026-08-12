"use client";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect } from "react";

/**
 * The `requireAdmin` / `requireUser` guards throw, so this boundary is a real
 * part of the authorisation flow, not just a crash screen. It deliberately
 * shows the same generic wording for "not allowed" as for "something broke" —
 * confirming that an admin area exists is itself a small leak.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <Logo className="mb-8" />
      <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
        That didn&apos;t work
      </h1>
      <p className="mt-2 max-w-sm text-muted">
        Something went wrong, or you don&apos;t have access to this page. Try again, or head
        back home.
      </p>
      <div className="mt-6 flex gap-2">
        <Button onClick={reset}>Try again</Button>
        <Button asChild variant="outline">
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
