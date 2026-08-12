"use client";

import { clientAuth, isFirebaseConfigured } from "@/lib/firebase/client";
import { onAuthStateChanged, type User } from "firebase/auth";
import { createContext, use, useEffect, useState, type ReactNode } from "react";

interface AuthState {
  /** The Firebase identity. Needed so Firestore listeners satisfy the rules. */
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthState>({ user: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  // Without Firebase configured there is nothing to wait for, so the initial
  // state says so rather than setting it synchronously in the effect below —
  // that would schedule a second render before the first one had painted.
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: isFirebaseConfigured,
  });

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    return onAuthStateChanged(clientAuth(), (user) => {
      setState({ user, loading: false });
    });
  }, []);

  return <AuthContext value={state}>{children}</AuthContext>;
}

export function useFirebaseUser() {
  return use(AuthContext);
}
