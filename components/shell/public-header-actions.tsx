"use client";

import { Button } from "@/components/ui/button";
import { useFirebaseUser } from "@/hooks/use-firebase-user";
import Link from "next/link";

/**
 * The sign-in/join controls in every public header (home, category pages,
 * marketing layout).
 *
 * These pages are static or ISR — that's deliberate, it's what makes them
 * fast and crawlable — so they can't read the session cookie at request time.
 * This checks the client-side Firebase auth state instead: no network call,
 * just the SDK's own in-memory state, so it resolves almost immediately for
 * a returning visitor.
 *
 * Reserves the space a signed-out visitor sees while that resolves, so
 * nothing shifts into place a beat after paint.
 */
export function PublicHeaderActions() {
  const { user, loading } = useFirebaseUser();

  if (loading) {
    return <div className="h-9 w-[9.5rem]" aria-hidden />;
  }

  if (user) {
    return (
      <Button asChild size="sm">
        <Link href="/dashboard">Dashboard</Link>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button asChild variant="ghost" size="sm">
        <Link href="/login">Sign in</Link>
      </Button>
      <Button asChild size="sm">
        <Link href="/signup">Join</Link>
      </Button>
    </div>
  );
}
