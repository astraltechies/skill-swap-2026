import { cn } from "@/lib/utils";

/**
 * Two chevrons pointing into each other — the swap, reduced to its smallest
 * possible statement. Amber gives, indigo gets.
 */
export function Logo({ className, showWordmark = true }: { className?: string; showWordmark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg
        viewBox="0 0 28 28"
        className="size-7 shrink-0"
        aria-hidden
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.75"
      >
        <path d="M4 9.5h13l-3.5-3.5" stroke="var(--teach)" />
        <path d="M24 18.5H11l3.5 3.5" stroke="var(--learn)" />
      </svg>
      {showWordmark ? (
        <span className="font-display text-lg font-semibold tracking-tight">
          Skill Swap
        </span>
      ) : null}
    </span>
  );
}
