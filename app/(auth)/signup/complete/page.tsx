import { getCurrentUser, getSessionClaims } from "@/lib/firebase/admin";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CompleteSignupForm } from "./complete-form";

export const metadata: Metadata = {
  title: "Finish setting up",
  robots: { index: false, follow: false },
};

/**
 * Reads the session to decide where to send the visitor, so it must never be
 * prerendered — a build without credentials would otherwise bake in the
 * redirect to /login and serve it to everyone.
 */
export const dynamic = "force-dynamic";

/**
 * Where a Google sign-in lands when it has an identity but no profile yet.
 * Consent is collected here rather than being skippable — an account without
 * a consent record must not be able to exist.
 */
export default async function CompleteSignupPage() {
  const claims = await getSessionClaims();
  if (!claims) redirect("/login");

  const existing = await getCurrentUser();
  if (existing) redirect("/dashboard");

  return (
    <CompleteSignupForm
      defaultName={(claims.name as string | undefined) ?? ""}
      email={(claims.email as string | undefined) ?? ""}
    />
  );
}
