import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <Logo className="mb-8" />
      <p className="tabular text-sm font-medium text-muted">404</p>
      <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
        Nothing here
      </h1>
      <p className="mt-2 max-w-sm text-muted">
        This page has moved, or the profile you were looking for is no longer on Skill Swap.
      </p>
      <div className="mt-6 flex gap-2">
        <Button asChild>
          <Link href="/">Go home</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/browse">Browse skills</Link>
        </Button>
      </div>
    </div>
  );
}
