import type { SkillLevel, SkillRef, UserProfile } from "@/types/firestore";

/**
 * Match scoring.
 *
 * The product is a *swap*, so a pair where each side can teach the other is
 * worth far more than a pair where only one side can — that asymmetry is the
 * single biggest weight here. Everything else (level fit, reputation,
 * availability, freshness) only reorders candidates within that split.
 *
 * Pure and dependency-free so it can run on the server, in the seed script, or
 * in a test without a Firestore connection.
 */

const WEIGHTS = {
  /** They teach something you want. Table stakes — without this there's no match. */
  theyTeachYouWant: 40,
  /** You teach something they want. This is what makes it a swap. */
  youTeachTheyWant: 45,
  /** Both directions filled. Deliberately large: a true swap outranks everything. */
  reciprocalBonus: 30,
  /** Teaching a beginner as an advanced student is a better fit than peer-to-peer. */
  levelFit: 10,
  /** Well-reviewed teachers surface first, but reputation never beats reciprocity. */
  reputation: 12,
  /** Overlapping free time means the session can actually happen. */
  availabilityOverlap: 8,
  /** A nudge for people with no reviews yet, so new joiners are reachable. */
  newcomerBoost: 6,
} as const;

const LEVEL_RANK: Record<SkillLevel, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
};

function skillIds(refs: SkillRef[]): Set<string> {
  return new Set(refs.map((r) => r.skillId));
}

function firstOverlap(a: SkillRef[], bWanted: Set<string>): SkillRef | null {
  return a.find((ref) => bWanted.has(ref.skillId)) ?? null;
}

/** Rewards a teacher who is meaningfully ahead of the learner, not miles ahead. */
function levelFitScore(teach: SkillRef | null, learn: SkillRef | null): number {
  if (!teach || !learn) return 0;
  const gap = LEVEL_RANK[teach.level] - LEVEL_RANK[learn.level];
  if (gap <= 0) return 0;
  return gap === 1 ? WEIGHTS.levelFit : WEIGHTS.levelFit * 0.6;
}

function availabilityOverlap(a: UserProfile, b: UserProfile): number {
  if (a.availability.length === 0 || b.availability.length === 0) return 0;

  const overlaps = a.availability.some((slotA) =>
    b.availability.some(
      (slotB) =>
        slotA.day === slotB.day && slotA.start < slotB.end && slotB.start < slotA.end,
    ),
  );
  return overlaps ? WEIGHTS.availabilityOverlap : 0;
}

export interface MatchResult {
  otherUid: string;
  score: number;
  /** What they can teach you. */
  theyTeach: string | null;
  /** What you can teach them. */
  youTeach: string | null;
  reciprocal: boolean;
}

export function scoreMatch(me: UserProfile, other: UserProfile): MatchResult | null {
  const myWants = skillIds(me.skillsLearn);
  const theirWants = skillIds(other.skillsLearn);

  const theyTeachRef = firstOverlap(other.skillsTeach, myWants);
  const youTeachRef = firstOverlap(me.skillsTeach, theirWants);

  // No overlap in either direction is not a match, however good their rating.
  if (!theyTeachRef && !youTeachRef) return null;

  const reciprocal = Boolean(theyTeachRef && youTeachRef);
  let score = 0;

  if (theyTeachRef) {
    score += WEIGHTS.theyTeachYouWant;
    score += levelFitScore(
      theyTeachRef,
      me.skillsLearn.find((r) => r.skillId === theyTeachRef.skillId) ?? null,
    );
  }

  if (youTeachRef) {
    score += WEIGHTS.youTeachTheyWant;
    score += levelFitScore(
      youTeachRef,
      other.skillsLearn.find((r) => r.skillId === youTeachRef.skillId) ?? null,
    );
  }

  if (reciprocal) score += WEIGHTS.reciprocalBonus;

  if (other.ratingCount > 0) {
    // Scaled by review count so one glowing review doesn't outrank ten good ones.
    const confidence = Math.min(other.ratingCount / 5, 1);
    score += ((other.ratingAvg - 3) / 2) * WEIGHTS.reputation * confidence;
  } else {
    score += WEIGHTS.newcomerBoost;
  }

  score += availabilityOverlap(me, other);

  return {
    otherUid: other.uid,
    score: Math.round(Math.max(score, 0)),
    theyTeach: theyTeachRef?.skillId ?? null,
    youTeach: youTeachRef?.skillId ?? null,
    reciprocal,
  };
}

export function findMatches(
  me: UserProfile,
  candidates: UserProfile[],
  options: { limit?: number; excludeUids?: Set<string> } = {},
): MatchResult[] {
  const { limit = 20, excludeUids } = options;

  return candidates
    .filter(
      (other) =>
        other.uid !== me.uid &&
        other.status === "active" &&
        !excludeUids?.has(other.uid),
    )
    .map((other) => scoreMatch(me, other))
    .filter((m): m is MatchResult => m !== null)
    .sort((a, b) => {
      // Two-way swaps always sit above one-way ones, whatever the raw score.
      if (a.reciprocal !== b.reciprocal) return a.reciprocal ? -1 : 1;
      return b.score - a.score;
    })
    .slice(0, limit);
}
