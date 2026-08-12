import { cn } from "@/lib/utils";
import type { SessionStatus, SkillLevel } from "@/types/firestore";
import type { ReactNode } from "react";

type Tone = "teach" | "learn" | "neutral" | "danger" | "success";

const TONES: Record<Tone, string> = {
  teach: "bg-teach-wash text-teach-ink border-teach/30",
  learn: "bg-learn-wash text-learn-ink border-learn/30",
  neutral: "bg-surface-sunk text-ink-soft border-line",
  danger: "bg-danger-wash text-danger border-danger/30",
  success: "bg-success-wash text-success border-success/30",
};

export function Pill({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium",
        // Pills are dense and mostly sit inside cards, so they lean on the
        // parent's hover rather than owning one: the border firms up as the
        // card lifts, which keeps a grid of them from feeling twitchy.
        "transition-colors duration-(--duration-fast)",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const LEVEL_MARK: Record<SkillLevel, string> = {
  beginner: "•",
  intermediate: "••",
  advanced: "•••",
};

/**
 * Level is shown as dots rather than a word — it keeps the pill short enough
 * to fit several across a phone screen, and reads as a rating at a glance.
 */
export function SkillPill({
  name,
  level,
  tone = "neutral",
  className,
}: {
  name: string;
  level?: SkillLevel;
  tone?: Tone;
  className?: string;
}) {
  return (
    <Pill tone={tone} className={className}>
      <span className="truncate">{name}</span>
      {level ? (
        <span
          className="font-mono text-[0.65rem] leading-none opacity-60"
          title={`${level.charAt(0).toUpperCase()}${level.slice(1)}`}
        >
          {LEVEL_MARK[level]}
        </span>
      ) : null}
    </Pill>
  );
}

const SESSION_TONES: Record<SessionStatus, Tone> = {
  requested: "neutral",
  accepted: "learn",
  declined: "neutral",
  cancelled: "neutral",
  completed: "success",
  no_show: "danger",
};

export function SessionStatusPill({ status }: { status: SessionStatus }) {
  const labels: Record<SessionStatus, string> = {
    requested: "Waiting for reply",
    accepted: "Confirmed",
    declined: "Declined",
    cancelled: "Cancelled",
    completed: "Completed",
    no_show: "No show",
  };
  return <Pill tone={SESSION_TONES[status]}>{labels[status]}</Pill>;
}

/**
 * Coins are always mono and always signed, so a ledger row reads as a ledger
 * row. Amber for earned, indigo for spent — the same two sides as everywhere.
 */
export function CoinAmount({
  amount,
  className,
  showSign = true,
}: {
  amount: number;
  className?: string;
  showSign?: boolean;
}) {
  const earned = amount >= 0;
  return (
    <span
      className={cn(
        "tabular font-medium",
        showSign && (earned ? "text-teach-ink" : "text-learn-ink"),
        className,
      )}
    >
      {showSign ? (earned ? "+" : "−") : ""}
      {Math.abs(amount)}
    </span>
  );
}
