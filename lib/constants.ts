import type { BadgeDef } from "@/types/firestore";

export const SITE_NAME = "Skill Swap";

/**
 * Bumping this re-prompts every existing user for consent on next sign-in.
 * Only bump when the privacy policy or terms materially change.
 */
export const POLICY_VERSION = "2026-01-v1";

/** Minimum age to hold an account, matching the school's own Class 9 intake. */
export const MIN_AGE = 13;

export const COINS = {
  /** Enough to book two sessions before you have taught anything. */
  welcomeBonus: 60,
  /** Standard price of a 45-minute session. */
  sessionCost: 25,
  /** Teacher receives the full amount the learner pays — the platform takes nothing. */
  sessionReward: 25,
} as const;

export const SESSION_DURATIONS = [30, 45, 60] as const;

export const DEFAULT_SESSION_DURATION = 45;

/** How long after the scheduled start a session can still be marked complete. */
export const SESSION_COMPLETE_WINDOW_MS = 1000 * 60 * 60 * 24 * 7;

export const BADGES: BadgeDef[] = [
  {
    id: "first_lesson",
    name: "First Lesson",
    description: "Taught your first session.",
    emoji: "🌱",
  },
  {
    id: "first_swap",
    name: "First Swap",
    description: "Taught someone and learned from someone.",
    emoji: "🔄",
  },
  {
    id: "five_taught",
    name: "Regular",
    description: "Taught five sessions.",
    emoji: "⭐",
  },
  {
    id: "ten_taught",
    name: "Mentor",
    description: "Taught ten sessions.",
    emoji: "🏆",
  },
  {
    id: "well_rated",
    name: "Well Rated",
    description: "Held a 4.5+ rating across five or more reviews.",
    emoji: "💎",
  },
  {
    id: "polymath",
    name: "Polymath",
    description: "Teaching three or more different skills.",
    emoji: "🧠",
  },
];

export const BADGE_BY_ID = new Map(BADGES.map((b) => [b.id, b]));

export const REPORT_REASON_LABELS: Record<string, string> = {
  safety_concern: "Safety concern",
  harassment: "Harassment or bullying",
  inappropriate_content: "Inappropriate content",
  spam: "Spam or advertising",
  no_show: "Did not turn up",
  other: "Something else",
};

/** Reports with these reasons jump the moderation queue. */
export const HIGH_PRIORITY_REASONS = new Set(["safety_concern", "harassment"]);

export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const SESSION_STATUS_LABELS: Record<string, string> = {
  requested: "Waiting for reply",
  accepted: "Confirmed",
  declined: "Declined",
  cancelled: "Cancelled",
  completed: "Completed",
  no_show: "No show",
};
