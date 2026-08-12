"use client";

import { clientAuth } from "@/lib/firebase/client";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
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
      return "There's already an account with this email. Try signing in.";
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
    default:
      return "Could not sign you in. Try again.";
  }
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

export async function signInWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const credential = await signInWithPopup(clientAuth(), provider);
  await establishSession(credential.user);
  return credential.user;
}

export async function signOut(): Promise<void> {
  await fetch("/api/auth/session", { method: "DELETE" });
  await firebaseSignOut(clientAuth());
}

/** Whether this identity already has a profile, or still needs the consent step. */
export async function hasProfile(): Promise<boolean> {
  const response = await fetch("/api/auth/me", { cache: "no-store" });
  if (!response.ok) return false;
  const data = await response.json();
  return Boolean(data.profile);
}
