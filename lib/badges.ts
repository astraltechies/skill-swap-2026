import type { UserProfile } from "@/types/firestore";

/**
 * Badge criteria, evaluated against a profile *after* its counters have been
 * updated. Pure so it can be unit-tested and reused by any route that changes
 * the numbers a badge depends on.
 */
export function earnedBadgeIds(user: {
  sessionsTaught: number;
  sessionsLearned: number;
  ratingAvg: number;
  ratingCount: number;
  skillsTeach: UserProfile["skillsTeach"];
}): string[] {
  const earned: string[] = [];

  if (user.sessionsTaught >= 1) earned.push("first_lesson");
  if (user.sessionsTaught >= 1 && user.sessionsLearned >= 1) earned.push("first_swap");
  if (user.sessionsTaught >= 5) earned.push("five_taught");
  if (user.sessionsTaught >= 10) earned.push("ten_taught");
  if (user.ratingCount >= 5 && user.ratingAvg >= 4.5) earned.push("well_rated");
  if (user.skillsTeach.length >= 3) earned.push("polymath");

  return earned;
}
