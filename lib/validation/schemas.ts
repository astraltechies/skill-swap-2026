import { z } from "zod";
import { MIN_AGE, SESSION_DURATIONS } from "@/lib/constants";
import { SKILL_LEVELS } from "@/types/firestore";

/** Reserved so nobody can pose as the platform or squat on a route name. */
const RESERVED_USERNAMES = new Set([
  "admin", "administrator", "moderator", "mod", "staff", "support", "help",
  "skillswap", "skill-swap", "official", "team", "root", "system", "api",
  "login", "signup", "settings", "profile", "browse", "sessions", "chat",
  "wallet", "leaderboard", "skillbot", "about", "privacy", "terms", "u", "me",
]);

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "At least 3 characters.")
  .max(20, "20 characters at most.")
  .regex(/^[a-z0-9_]+$/, "Letters, numbers and underscores only.")
  .refine((v) => !RESERVED_USERNAMES.has(v), "That username is not available.");

export const displayNameSchema = z
  .string()
  .trim()
  .min(2, "Tell us your name.")
  .max(50, "50 characters at most.");

export const skillRefSchema = z.object({
  skillId: z.string().min(1),
  level: z.enum(SKILL_LEVELS),
});

export const availabilitySchema = z.object({
  day: z.number().int().min(0).max(6),
  start: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use a time like 16:30."),
  end: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use a time like 18:00."),
});

/**
 * Signup carries the consent record, so the two can never drift apart — an
 * account cannot exist without the guardian details that authorised it.
 */
export const initAccountSchema = z.object({
  displayName: displayNameSchema,
  username: usernameSchema,
  city: z.string().trim().max(60).default(""),
  ageConfirmed: z.literal(true, {
    message: `You must confirm you are ${MIN_AGE} or older.`,
  }),
  guardianName: z
    .string()
    .trim()
    .min(2, "Enter your parent or guardian's name.")
    .max(60),
  guardianEmail: z.email("Enter a valid email address."),
  guardianConsent: z.literal(true, {
    message: "A parent or guardian must give consent.",
  }),
});

export const profileUpdateSchema = z.object({
  displayName: displayNameSchema,
  bio: z.string().trim().max(400, "400 characters at most.").default(""),
  city: z.string().trim().max(60).default(""),
  skillsTeach: z.array(skillRefSchema).max(10, "Up to 10 skills.").default([]),
  skillsLearn: z.array(skillRefSchema).max(10, "Up to 10 skills.").default([]),
  availability: z.array(availabilitySchema).max(14).default([]),
});

export const bookingRequestSchema = z.object({
  teacherId: z.string().min(1),
  skillId: z.string().min(1),
  scheduledAt: z
    .number()
    .int()
    .refine((t) => t > Date.now(), "Pick a time in the future.")
    .refine(
      (t) => t < Date.now() + 1000 * 60 * 60 * 24 * 60,
      "Pick a time within the next two months.",
    ),
  durationMins: z
    .number()
    .int()
    .refine(
      (d) => (SESSION_DURATIONS as readonly number[]).includes(d),
      "Choose one of the offered lengths.",
    ),
  note: z.string().trim().max(300).default(""),
});

export const bookingRespondSchema = z.object({
  sessionId: z.string().min(1),
  accept: z.boolean(),
});

export const ratingSchema = z.object({
  sessionId: z.string().min(1),
  stars: z.number().int().min(1).max(5),
  comment: z.string().trim().max(300).default(""),
});

export const reportSchema = z.object({
  reportedUserId: z.string().min(1),
  contentType: z.enum(["profile", "message", "session"]),
  contentRef: z.string().nullable().default(null),
  reason: z.enum([
    "safety_concern",
    "harassment",
    "inappropriate_content",
    "spam",
    "no_show",
    "other",
  ]),
  details: z.string().trim().max(1000).default(""),
});

export const chatbotSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(2000),
      }),
    )
    .min(1)
    .max(20),
});

export type InitAccountInput = z.infer<typeof initAccountSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type BookingRequestInput = z.infer<typeof bookingRequestSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
