"use client";

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

/**
 * These NEXT_PUBLIC_ values are not secrets — Firebase expects them in the
 * client bundle. All actual protection comes from firestore.rules and from
 * the server routes that hold the Admin credentials.
 *
 * No Storage: Firebase now requires the paid Blaze plan to create a Storage
 * bucket at all, even within the free quota. Avatars fall back to initials
 * (see components/ui/avatar.tsx) or, for Google sign-in, the photo already on
 * the Google account — so nothing in the app depends on Storage existing.
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId,
);

let app: FirebaseApp | null = null;

function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured) {
    throw new Error(
      "Firebase is not configured. Copy .env.local.example to .env.local and fill in the NEXT_PUBLIC_FIREBASE_* values.",
    );
  }
  if (!app) {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  }
  return app;
}

export function clientAuth(): Auth {
  return getAuth(getFirebaseApp());
}

export function clientDb(): Firestore {
  return getFirestore(getFirebaseApp());
}
