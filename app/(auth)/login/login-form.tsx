"use client";

import { Button } from "@/components/ui/button";
import { Field, FieldError, Input, PasswordInput } from "@/components/ui/field";
import {
  clearClientAuth,
  completeGoogleRedirect,
  friendlyAuthError,
  hasProfile,
  signInWithEmail,
  signInWithGoogle,
} from "@/lib/auth/actions";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const sessionExpired = searchParams.get("expired") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState<"email" | "google" | null>(null);

  /** New Google identities have no profile yet, so they finish signup first. */
  async function routeAfterSignIn() {
    router.push((await hasProfile()) ? next : "/signup/complete");
    router.refresh();
  }

  // Picks up a Google sign-in that had to fall back to a full-page redirect
  // because the browser blocked the popup. On an ordinary load this resolves
  // to null and does nothing.
  useEffect(() => {
    let cancelled = false;
    completeGoogleRedirect()
      .then((user) => {
        if (user && !cancelled) {
          setPending("google");
          return routeAfterSignIn();
        }
        // Arriving here from /logout means the server session is gone, but the
        // client SDK still holds its own copy in IndexedDB. Clear it so the two
        // don't disagree about who is signed in.
        if (!user && sessionExpired) void clearClientAuth();
      })
      .catch((err) => {
        if (!cancelled) setError(friendlyAuthError(err));
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleEmail(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setPending("email");
    try {
      await signInWithEmail(email.trim(), password);
      await routeAfterSignIn();
    } catch (err) {
      setError(friendlyAuthError(err));
      setPending(null);
    }
  }

  async function handleGoogle() {
    setError("");
    setPending("google");
    try {
      const user = await signInWithGoogle();
      // `null` means the popup was blocked and a full-page redirect is now in
      // flight — leave the spinner up rather than routing, the page is leaving.
      if (user) await routeAfterSignIn();
    } catch (err) {
      setError(friendlyAuthError(err));
      setPending(null);
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
        Welcome back
      </h1>
      <p className="mt-1.5 text-sm text-muted">
        Sign in to pick up your sessions and messages.
      </p>

      {sessionExpired ? (
        <p
          className="mt-4 rounded-xl border border-line bg-surface-sunk px-3.5 py-3 text-sm text-ink-soft"
          role="status"
        >
          You were signed out. Sign in again to carry on.
        </p>
      ) : null}

      <form onSubmit={handleEmail} noValidate className="mt-6 space-y-4">
        <Field label="Email">
          {(id) => (
            <Input
              id={id}
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
              required
            />
          )}
        </Field>

        <Field label="Password">
          {(id) => (
            <PasswordInput
              id={id}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          )}
        </Field>

        {error ? (
          <div className="rounded-xl border border-danger/30 bg-danger-wash px-3.5 py-3">
            <FieldError>{error}</FieldError>
          </div>
        ) : null}

        <Button type="submit" size="lg" fullWidth loading={pending === "email"}>
          Sign in
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="text-xs uppercase tracking-wide text-muted">or</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <Button
        type="button"
        variant="outline"
        size="lg"
        fullWidth
        onClick={handleGoogle}
        loading={pending === "google"}
      >
        <svg className="size-4" viewBox="0 0 24 24" aria-hidden>
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
          />
        </svg>
        Continue with Google
      </Button>

      <p className="mt-6 text-center text-sm text-muted">
        New here?{" "}
        <Link href="/signup" className="font-medium text-ink underline underline-offset-2">
          Create an account
        </Link>
      </p>
    </div>
  );
}
