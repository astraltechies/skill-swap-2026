"use client";

import { clientAuth } from "@/lib/firebase/client";
import {
  createUserWithEmailAndPassword,
  getRedirectResult,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from "firebase/auth";

/**
 * Firebase's error codes are deliberately vague about whether an account
 * exists — keep them that way in the UI rather than translating them into
 * something that confirms an email is registered.
 */
export function friendlyAuthError(error: unknown): string {
  const code = (error as { code?: string })?.code ?? "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "That email and password don't match. Try again.";
    case "auth/email-already-in-use":
      // Most often this is someone who already used "Continue with Google" on
      // this address, so name that path rather than just saying "sign in".
      return "There's already an account with this email. Sign in instead — with Google if that's how you set it up.";
    case "auth/weak-password":
      return "Pick a password with at least 8 characters.";
    case "auth/invalid-email":
      return "That doesn't look like a valid email address.";
    case "auth/too-many-requests":
      return "Too many attempts. Wait a few minutes and try again.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Sign-in was cancelled.";
    case "auth/network-request-failed":
      return "Check your internet connection and try again.";
    // These three are configuration faults, not user mistakes. They used to
    // fall through to the generic message, which hid the actual cause and made
    // a five-minute console fix look like a broken app.
    case "auth/unauthorized-domain":
      return "This site isn't authorised for Google sign-in yet. Add its domain under Firebase Authentication → Settings → Authorized domains.";
    case "auth/operation-not-allowed":
      return "Google sign-in isn't switched on for this project. Enable it under Firebase Authentication → Sign-in method.";
    case "auth/account-exists-with-different-credential":
      return "You already have an account with this email. Sign in with your password instead.";
    default:
      return "Could not sign you in. Try again.";
  }
}

/**
 * Popups are unreliable on mobile browsers — in-app webviews and iOS Safari
 * block them outright — and this app is used mostly on phones. These are the
 * codes that mean "the popup never opened", as opposed to "the user closed it".
 */
function popupUnavailable(error: unknown): boolean {
  const code = (error as { code?: string })?.code ?? "";
  return (
    code === "auth/popup-blocked" ||
    code === "auth/operation-not-supported-in-this-environment" ||
    code === "auth/web-storage-unsupported"
  );
}

/** Swaps the ID token for the httpOnly session cookie the server trusts. */
async function establishSession(user: User): Promise<void> {
  const idToken = await user.getIdToken(true);
  const response = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });

  if (!response.ok) {
    const { error } = await response.json().catch(() => ({ error: "" }));
    throw new Error(error || "Could not start a session.");
  }
}

export async function signUpWithEmail(params: {
  email: string;
  password: string;
  displayName: string;
}): Promise<User> {
  const credential = await createUserWithEmailAndPassword(
    clientAuth(),
    params.email,
    params.password,
  );
  await updateProfile(credential.user, { displayName: params.displayName });
  await establishSession(credential.user);
  return credential.user;
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(clientAuth(), email, password);
  await establishSession(credential.user);
  return credential.user;
}

/**
 * Returns the signed-in user, or `null` when the browser could not open a
 * popup and we've handed off to a full-page redirect instead — in that case
 * the page is already navigating away and `completeGoogleRedirect()` picks the
 * result up on the way back.
 */
export async function signInWithGoogle(): Promise<User | null> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  try {
    const credential = await signInWithPopup(clientAuth(), provider);
    await establishSession(credential.user);
    return credential.user;
  } catch (error) {
    if (!popupUnavailable(error)) throw error;
    await signInWithRedirect(clientAuth(), provider);
    return null;
  }
}

/**
 * Call once on mount. Resolves to the user when the page has just come back
 * from a Google redirect, and `null` on an ordinary page load.
 */
export async function completeGoogleRedirect(): Promise<User | null> {
  const result = await getRedirectResult(clientAuth());
  if (!result) return null;
  await establishSession(result.user);
  return result.user;
}

export async function signOut(): Promise<void> {
  await fetch("/api/auth/session", { method: "DELETE" });
  await firebaseSignOut(clientAuth());
}

/**
 * Drops the client SDK's own copy of the session. Used after the server has
 * already cleared the cookie (via /logout), so the two don't disagree about
 * who is signed in.
 */
export async function clearClientAuth(): Promise<void> {
  try {
    await firebaseSignOut(clientAuth());
  } catch {
    // Nothing to clear, or Firebase isn't configured. Either is fine here.
  }
}

/** Whether this identity already has a profile, or still needs the consent step. */
export async function hasProfile(): Promise<boolean> {
  const response = await fetch("/api/auth/me", { cache: "no-store" });
  if (!response.ok) return false;
  const data = await response.json();
  return Boolean(data.profile);
}
