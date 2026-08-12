/**
 * Canonical Firestore data model. Shared by client components, Route Handlers,
 * and the seed script — this file is the single source of truth for shapes.
 *
 * Timestamps are stored as epoch milliseconds (number), not Firestore
 * `Timestamp` objects. Two reasons: they cross the Server -> Client Component
 * boundary without a serialization step, and they sort/range-query identically.
 */

export const SKILL_LEVELS = ["beginner", "intermediate", "advanced"] as const;

export type SkillLevel = (typeof SKILL_LEVELS)[number];

export type UserRole = "student" | "admin";

export type UserStatus = "active" | "under_review" | "suspended" | "banned";

/** A skill a user teaches or wants to learn. */
export interface SkillRef {
  skillId: string;
  /** For `skillsTeach`: how well they know it. For `skillsLearn`: where they're starting. */
  level: SkillLevel;
}

/** A recurring weekly window the student is free. Times are "HH:mm" local. */
export interface AvailabilityWindow {
  /** 0 = Sunday ... 6 = Saturday */
  day: number;
  start: string;
  end: string;
}

export interface GuardianConsent {
  given: boolean;
  guardianName: string;
  guardianEmail: string;
  /** Epoch ms. */
  consentedAt: number;
  /** Which version of the policy was agreed to, so we can re-prompt on change. */
  policyVersion: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  username: string;
  photoURL: string | null;
  bio: string;
  /** Broad location, city-level at most. We never collect an address. */
  city: string;
  role: UserRole;
  status: UserStatus;

  ageConfirmed: boolean;
  guardianConsent: GuardianConsent | null;

  skillsTeach: SkillRef[];
  skillsLearn: SkillRef[];
  availability: AvailabilityWindow[];

  /**
   * Mirrors `skillsTeach.length > 0`.
   *
   * Firestore cannot query for a non-empty array, so without this the browse
   * and match queries had to over-fetch and filter in memory — which meant the
   * `limit` was applied *before* the filter and the site silently showed an
   * arbitrary fixed subset of students. Written wherever `skillsTeach` is.
   */
  isTeaching: boolean;

  /** Server-controlled. Clients can never write these — see firestore.rules. */
  coinBalance: number;
  ratingAvg: number;
  ratingCount: number;
  sessionsTaught: number;
  sessionsLearned: number;
  reportCount: number;

  createdAt: number;
  updatedAt: number;
}

/** Fields safe to expose on a public, unauthenticated profile page. */
export type PublicUserProfile = Pick<
  UserProfile,
  | "uid"
  | "displayName"
  | "username"
  | "photoURL"
  | "bio"
  | "city"
  | "skillsTeach"
  | "ratingAvg"
  | "ratingCount"
  | "sessionsTaught"
>;

export interface SkillCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  /** Emoji used as the category mark — keeps the bundle free of icon images. */
  emoji: string;
  featured: boolean;
  order: number;
}

export interface Skill {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  description: string;
  tags: string[];
  featured: boolean;
  /** Denormalised counter so browse pages don't aggregate on read. */
  teacherCount: number;
}

export type MatchStatus = "suggested" | "dismissed" | "connected";

export interface Match {
  id: string;
  /** Sorted pair, so a match between two users has one canonical id. */
  userIds: [string, string];
  /** What userIds[0] can teach userIds[1]. */
  skillAtoB: string | null;
  /** What userIds[1] can teach userIds[0]. */
  skillBtoA: string | null;
  score: number;
  /** True when both directions are filled — the real "swap". */
  reciprocal: boolean;
  status: MatchStatus;
  createdAt: number;
}

export type SessionStatus =
  | "requested"
  | "accepted"
  | "declined"
  | "cancelled"
  | "completed"
  | "no_show";

export interface Session {
  id: string;
  teacherId: string;
  learnerId: string;
  skillId: string;
  status: SessionStatus;
  /**
   * Always "video". Sessions between students are never arranged in person —
   * enforced in firestore.rules, not just here.
   */
  mode: "video";
  /** Epoch ms of the agreed start time. */
  scheduledAt: number;
  durationMins: number;
  /** Unguessable room name derived from the session id. */
  roomId: string;
  coinAmount: number;
  note: string;
  /** Set once the coin transfer has run, so it can never run twice. */
  settledAt: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface ChatThread {
  id: string;
  participantIds: string[];
  lastMessage: string;
  lastMessageAt: number;
  lastSenderId: string;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  createdAt: number;
}

export interface Rating {
  id: string;
  sessionId: string;
  raterId: string;
  ratedUserId: string;
  /** 1-5 */
  stars: number;
  comment: string;
  createdAt: number;
}

export type CoinTxType =
  | "welcome_bonus"
  | "session_earned"
  | "session_spent"
  | "admin_adjustment"
  | "refund";

export interface CoinTransaction {
  id: string;
  userId: string;
  /** Positive = credit, negative = debit. */
  amount: number;
  type: CoinTxType;
  description: string;
  relatedSessionId: string | null;
  balanceAfter: number;
  createdAt: number;
}

export interface BadgeDef {
  id: string;
  name: string;
  description: string;
  emoji: string;
}

export interface AwardedBadge {
  badgeId: string;
  awardedAt: number;
}

export type ReportReason =
  | "safety_concern"
  | "harassment"
  | "inappropriate_content"
  | "spam"
  | "no_show"
  | "other";

export type ReportPriority = "high" | "normal";

export type ReportStatus = "open" | "in_review" | "resolved" | "dismissed";

export interface Report {
  id: string;
  reporterId: string;
  reportedUserId: string;
  contentType: "profile" | "message" | "session";
  contentRef: string | null;
  reason: ReportReason;
  details: string;
  /** Derived server-side from `reason` — clients cannot set this. */
  priority: ReportPriority;
  status: ReportStatus;
  adminNotes: string;
  resolvedBy: string | null;
  resolvedAt: number | null;
  createdAt: number;
}

/**
 * Append-only consent log. Rows are never updated or deleted — the summary on
 * the user doc can drift, this is the record that actually matters.
 */
export interface ConsentRecord {
  id: string;
  uid: string;
  ageConfirmed: boolean;
  guardianName: string;
  guardianEmail: string;
  policyVersion: string;
  consentedAt: number;
  userAgent: string;
}

export type AdminActionType =
  | "ban_user"
  | "unban_user"
  | "suspend_user"
  | "resolve_report"
  | "dismiss_report"
  | "adjust_coins"
  | "feature_skill";

export interface AdminAction {
  id: string;
  adminId: string;
  actionType: AdminActionType;
  targetId: string;
  notes: string;
  createdAt: number;
}

export interface Notification {
  id: string;
  type:
    | "booking_request"
    | "booking_accepted"
    | "booking_declined"
    | "session_reminder"
    | "session_completed"
    | "new_message"
    | "badge_earned";
  title: string;
  body: string;
  href: string;
  read: boolean;
  createdAt: number;
}

/** Precomputed so the leaderboard page reads one document. */
export interface LeaderboardSnapshot {
  updatedAt: number;
  topTeachers: {
    uid: string;
    displayName: string;
    username: string;
    photoURL: string | null;
    sessionsTaught: number;
    ratingAvg: number;
  }[];
}

export const COLLECTIONS = {
  users: "users",
  usernames: "usernames",
  skillCategories: "skillCategories",
  skills: "skills",
  matches: "matches",
  sessions: "sessions",
  chatThreads: "chatThreads",
  ratings: "ratings",
  coinTransactions: "coinTransactions",
  badges: "badges",
  reports: "reports",
  consentRecords: "consentRecords",
  adminActions: "adminActions",
  siteConfig: "siteConfig",
  aiUsageLogs: "aiUsageLogs",
} as const;
