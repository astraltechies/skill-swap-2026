import "server-only";

import { cert, getApp, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { cookies } from "next/headers";
import { COLLECTIONS, type UserProfile } from "@/types/firestore";

/**
 * The trust boundary of the whole app.
 *
 * Everything the client is not allowed to write for itself — coin balances,
 * ratings, report priority, account status — is written here with Admin
 * credentials, behind an identity check. firestore.rules denies those same
 * fields to every client, so this is the only door.
 */

export const SESSION_COOKIE = "__session";

/** Two weeks, the Firebase maximum for a session cookie. */
export const SESSION_MAX_AGE_MS = 60 * 60 * 24 * 14 * 1000;

let adminApp: App | null = null;

export const isAdminConfigured = Boolean(
  process.env.FIREBASE_ADMIN_PROJECT_ID &&
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
    process.env.FIREBASE_ADMIN_PRIVATE_KEY,
);

function getAdminApp(): App {
  if (!isAdminConfigured) {
    throw new Error(
      "Firebase Admin is not configured. Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL and FIREBASE_ADMIN_PRIVATE_KEY.",
    );
  }
  if (!adminApp) {
    adminApp = getApps().length
      ? getApp()
      : initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
            clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
            // Dashboards store the key with literal \n sequences.
            privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
          }),
        });
  }
  return adminApp;
}

export function adminAuth() {
  return getAuth(getAdminApp());
}

export function adminDb(): Firestore {
  return getFirestore(getAdminApp());
}

/**
 * Exchanges a freshly minted ID token for an httpOnly session cookie.
 * The ID token itself never touches storage the browser can read.
 */
export async function createSessionCookie(idToken: string): Promise<string> {
  const decoded = await adminAuth().verifyIdToken(idToken, true);

  // Only mint a session from a very recent sign-in, so a stolen ID token
  // cannot be replayed into a two-week session later.
  const fiveMinutesAgo = Date.now() / 1000 - 5 * 60;
  if (decoded.auth_time < fiveMinutesAgo) {
    throw new Error("Sign in again to continue.");
  }

  return adminAuth().createSessionCookie(idToken, {
    expiresIn: SESSION_MAX_AGE_MS,
  });
}

/** Verifies the session cookie, including whether it has been revoked. */
export async function verifySession(cookie: string): Promise<DecodedIdToken | null> {
  try {
    return await adminAuth().verifySessionCookie(cookie, true);
  } catch {
    return null;
  }
}

/** The signed-in user's claims, or null. Never throws. */
export async function getSessionClaims(): Promise<DecodedIdToken | null> {
  if (!isAdminConfigured) return null;
  const store = await cookies();
  const cookie = store.get(SESSION_COOKIE)?.value;
  if (!cookie) return null;
  return verifySession(cookie);
}

/** The signed-in user's full profile, or null. */
export async function getCurrentUser(): Promise<UserProfile | null> {
  const claims = await getSessionClaims();
  if (!claims) return null;

  const snap = await adminDb().collection(COLLECTIONS.users).doc(claims.uid).get();
  if (!snap.exists) return null;

  const profile = snap.data() as UserProfile;

  // A banned account holding a still-valid cookie must not resolve to a user.
  if (profile.status === "banned") return null;

  return profile;
}

export class AuthError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/** Use in Route Handlers. Throws `AuthError` the handler converts to a response. */
export async function requireUser(): Promise<UserProfile> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Sign in to continue.", 401);
  if (user.status === "suspended") {
    throw new AuthError("This account is suspended.", 403);
  }
  return user;
}

/**
 * Booking, chatting and messaging all require a consent record. Browsing does
 * not — a student can look around before their guardian has signed off.
 */
export async function requireConsentedUser(): Promise<UserProfile> {
  const user = await requireUser();
  if (!user.guardianConsent?.given) {
    throw new AuthError("A parent or guardian needs to give consent first.", 403);
  }
  return user;
}

export async function requireAdmin(): Promise<UserProfile> {
  const user = await requireUser();
  if (user.role !== "admin") throw new AuthError("Admins only.", 403);
  return user;
}
