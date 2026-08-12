"use client";

import { clientAuth, isFirebaseConfigured } from "@/lib/firebase/client";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useEffect, useState } from "react";

/**
 * The Firebase identity, needed so Firestore listeners satisfy the security
 * rules. Used by live chat and the block button, and nothing else.
 *
 * This subscribes directly rather than reading a context. It used to be a
 * provider wrapped around the whole signed-in tree, which pulled the Firebase
 * Auth SDK into the shared bundle for every page — including Wallet,
 * Leaderboard and Sessions, none of which need a client-side identity at all.
 * Two components each holding their own subscription is cheaper than that, and
 * the SDK is a singleton so they share the underlying connection.
 */
export function useFirebaseUser(): { user: User | null; loading: boolean } {
  const [state, setState] = useState<{ user: User | null; loading: boolean }>({
    user: null,
    loading: true,
  });

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setState({ user: null, loading: false });
      return;
    }
    return onAuthStateChanged(clientAuth(), (user) => setState({ user, loading: false }));
  }, []);

  return state;
}
