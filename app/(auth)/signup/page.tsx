import type { Metadata } from "next";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = {
  title: "Create your account",
  description:
    "Join Skill Swap to teach what you know and learn what you don't, with guardian consent and video-only sessions.",
  robots: { index: false, follow: false },
};

export default function SignupPage() {
  return <SignupForm />;
}
