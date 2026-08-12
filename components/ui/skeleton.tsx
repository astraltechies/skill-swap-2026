import { cn } from "@/lib/utils";

/**
 * A placeholder block that shimmers while real content loads.
 *
 * The shimmer is a moving gradient rather than a pulsing opacity: it reads as
 * "working" instead of "broken", and it keeps its own rhythm regardless of how
 * many skeletons are on screen. Suppressed entirely by the reduced-motion
 * block in globals.css, where it degrades to a flat block.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "rounded-lg bg-surface-sunk",
        "bg-[linear-gradient(90deg,var(--surface-sunk)_25%,var(--line)_50%,var(--surface-sunk)_75%)]",
        "bg-[length:200%_100%] animate-(--animate-shimmer)",
        className,
      )}
    />
  );
}

/** Screen-reader announcement to pair with a page full of skeletons. */
export function LoadingLabel({ children = "Loading" }: { children?: string }) {
  return (
    <span role="status" aria-live="polite" className="sr-only">
      {children}
    </span>
  );
}

/** Mirrors the shape of a SwapCard so the grid doesn't reflow when data lands. */
export function SwapCardSkeleton() {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-start gap-3">
        <Skeleton className="size-11 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-5 w-10 rounded-full" />
      </div>

      <Skeleton className="mt-4 h-2.5 w-16" />
      <div className="mt-2 flex gap-1.5">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>

      <Skeleton className="mt-4 h-2.5 w-20" />
      <div className="mt-2 flex gap-1.5">
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
    </div>
  );
}

/** A generic list row: avatar, two lines of text, trailing control. */
export function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 sm:p-4">
      <Skeleton className="size-11 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-28" />
      </div>
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
  );
}

export function PageHeaderSkeleton({ withSubtitle = true }: { withSubtitle?: boolean }) {
  return (
    <div className="mb-5 space-y-2 sm:mb-6">
      <Skeleton className="h-8 w-48" />
      {withSubtitle ? <Skeleton className="h-4 w-64" /> : null}
    </div>
  );
}
