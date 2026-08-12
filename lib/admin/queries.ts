import "server-only";

import { adminDb, isAdminConfigured } from "@/lib/firebase/admin";
import { COLLECTIONS, type Report, type Session, type UserProfile } from "@/types/firestore";
import { cache } from "react";

export interface AdminStats {
  totalStudents: number;
  activeStudents: number;
  underReview: number;
  suspended: number;
  totalSessions: number;
  completedSessions: number;
  upcomingSessions: number;
  openReports: number;
  highPriorityReports: number;
  coinsInCirculation: number;
  topSkills: { skillId: string; teachers: number }[];
  signupsLast7Days: number;
}

export const getAdminStats = cache(async (): Promise<AdminStats> => {
  if (!isAdminConfigured) throw new Error("Firebase Admin is not configured.");

  const db = adminDb();
  const [usersSnap, sessionsSnap, reportsSnap] = await Promise.all([
    db.collection(COLLECTIONS.users).get(),
    db.collection(COLLECTIONS.sessions).get(),
    db.collection(COLLECTIONS.reports).where("status", "in", ["open", "in_review"]).get(),
  ]);

  const users = usersSnap.docs.map((d) => d.data() as UserProfile);
  const sessions = sessionsSnap.docs.map((d) => d.data() as Session);
  const reports = reportsSnap.docs.map((d) => d.data() as Report);

  const weekAgo = Date.now() - 1000 * 60 * 60 * 24 * 7;
  const skillCounts = new Map<string, number>();
  for (const user of users) {
    for (const skill of user.skillsTeach) {
      skillCounts.set(skill.skillId, (skillCounts.get(skill.skillId) ?? 0) + 1);
    }
  }

  return {
    totalStudents: users.length,
    activeStudents: users.filter((u) => u.status === "active").length,
    underReview: users.filter((u) => u.status === "under_review").length,
    suspended: users.filter((u) => u.status === "suspended" || u.status === "banned").length,
    totalSessions: sessions.length,
    completedSessions: sessions.filter((s) => s.status === "completed").length,
    upcomingSessions: sessions.filter(
      (s) => s.status === "accepted" && s.scheduledAt > Date.now(),
    ).length,
    openReports: reports.length,
    highPriorityReports: reports.filter((r) => r.priority === "high").length,
    coinsInCirculation: users.reduce((sum, u) => sum + u.coinBalance, 0),
    topSkills: [...skillCounts.entries()]
      .map(([skillId, teachers]) => ({ skillId, teachers }))
      .sort((a, b) => b.teachers - a.teachers)
      .slice(0, 8),
    signupsLast7Days: users.filter((u) => u.createdAt > weekAgo).length,
  };
});

/**
 * The moderation queue. Sorted so safety concerns are unmissable: high
 * priority first, then oldest, because a report that has been waiting is the
 * one most likely to have been forgotten.
 */
export const getReportQueue = cache(async (): Promise<Report[]> => {
  if (!isAdminConfigured) return [];

  const snap = await adminDb()
    .collection(COLLECTIONS.reports)
    .where("status", "in", ["open", "in_review"])
    .limit(200)
    .get();

  return snap.docs
    .map((d) => ({ ...d.data(), id: d.id }) as Report)
    .sort((a, b) => {
      if (a.priority !== b.priority) return a.priority === "high" ? -1 : 1;
      return a.createdAt - b.createdAt;
    });
});

export const getResolvedReports = cache(async (limit = 25): Promise<Report[]> => {
  if (!isAdminConfigured) return [];
  const snap = await adminDb()
    .collection(COLLECTIONS.reports)
    .where("status", "in", ["resolved", "dismissed"])
    .limit(limit)
    .get();
  return snap.docs
    .map((d) => ({ ...d.data(), id: d.id }) as Report)
    .sort((a, b) => (b.resolvedAt ?? 0) - (a.resolvedAt ?? 0));
});

export const getAllUsers = cache(async (): Promise<UserProfile[]> => {
  if (!isAdminConfigured) return [];
  const snap = await adminDb().collection(COLLECTIONS.users).limit(500).get();
  return snap.docs
    .map((d) => d.data() as UserProfile)
    .sort((a, b) => {
      // Accounts needing attention float to the top of the list.
      const weight = (u: UserProfile) =>
        u.status === "under_review" ? 0 : u.status === "active" ? 1 : 2;
      return weight(a) - weight(b) || b.createdAt - a.createdAt;
    });
});
