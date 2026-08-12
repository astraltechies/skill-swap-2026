"use client";

import { Button } from "@/components/ui/button";
import { Checkbox, Field, FieldError, Input, PasswordInput } from "@/components/ui/field";
import { friendlyAuthError, signUpWithEmail } from "@/lib/auth/actions";
import { MIN_AGE } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { ArrowLeft, ShieldCheck, Video } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Step = "account" | "consent";

export function SignupForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("account");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [values, setValues] = useState({
    displayName: "",
    username: "",
    email: "",
    password: "",
    city: "",
    guardianName: "",
    guardianEmail: "",
    ageConfirmed: false,
    guardianConsent: false,
  });

  const set = (key: keyof typeof values) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value =
      event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  function validateAccount(): boolean {
    const next: Record<string, string> = {};
    if (values.displayName.trim().length < 2) next.displayName = "Tell us your name.";
    if (!/^[a-z0-9_]{3,20}$/.test(values.username.trim().toLowerCase())) {
      next.username = "3–20 characters: letters, numbers and underscores.";
    }
    if (!/^\S+@\S+\.\S+$/.test(values.email)) next.email = "Enter a valid email address.";
    if (values.password.length < 8) next.password = "At least 8 characters.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function validateConsent(): boolean {
    const next: Record<string, string> = {};
    if (!values.ageConfirmed) next.ageConfirmed = `You must be ${MIN_AGE} or older.`;
    if (values.guardianName.trim().length < 2) {
      next.guardianName = "Enter your parent or guardian's name.";
    }
    if (!/^\S+@\S+\.\S+$/.test(values.guardianEmail)) {
      next.guardianEmail = "Enter a valid email address.";
    }
    if (!values.guardianConsent) {
      next.guardianConsent = "A parent or guardian must give consent.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError("");

    if (step === "account") {
      if (validateAccount()) setStep("consent");
      return;
    }

    if (!validateConsent()) return;

    setSubmitting(true);
    try {
      await signUpWithEmail({
        email: values.email.trim(),
        password: values.password,
        displayName: values.displayName.trim(),
      });

      const response = await fetch("/api/auth/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: values.displayName.trim(),
          username: values.username.trim().toLowerCase(),
          city: values.city.trim(),
          ageConfirmed: true,
          guardianName: values.guardianName.trim(),
          guardianEmail: values.guardianEmail.trim(),
          guardianConsent: true,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (data.field === "username") {
          setErrors({ username: data.error });
          setStep("account");
          return;
        }
        throw new Error(data.error ?? "Could not finish creating your account.");
      }

      router.push("/profile/edit?welcome=1");
    } catch (error) {
      setFormError(
        error instanceof Error && !(error as { code?: string }).code
          ? error.message
          : friendlyAuthError(error),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <div className="mb-4 flex items-center gap-1.5" aria-hidden>
          <span className="h-1 flex-1 rounded-full bg-teach" />
          <span
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              step === "consent" ? "bg-learn" : "bg-line",
            )}
          />
        </div>
        <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted">
          Step {step === "account" ? "1" : "2"} of 2
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          {step === "account" ? "Create your account" : "Guardian consent"}
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          {step === "account"
            ? "You'll pick your skills right after this."
            : "Skill Swap is for students, so a parent or guardian signs off before you can book or message anyone."}
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {step === "account" ? (
          <>
            <Field label="Your name" error={errors.displayName}>
              {(id, describedBy) => (
                <Input
                  id={id}
                  aria-describedby={describedBy}
                  value={values.displayName}
                  onChange={set("displayName")}
                  autoComplete="name"
                  placeholder="Aarav Sharma"
                  invalid={Boolean(errors.displayName)}
                />
              )}
            </Field>

            <Field
              label="Username"
              error={errors.username}
              help="This is your public profile link: skillswap.app/u/yourname"
            >
              {(id, describedBy) => (
                <Input
                  id={id}
                  aria-describedby={describedBy}
                  value={values.username}
                  onChange={set("username")}
                  autoComplete="username"
                  placeholder="aarav_s"
                  invalid={Boolean(errors.username)}
                />
              )}
            </Field>

            <Field label="Email" error={errors.email}>
              {(id, describedBy) => (
                <Input
                  id={id}
                  type="email"
                  inputMode="email"
                  aria-describedby={describedBy}
                  value={values.email}
                  onChange={set("email")}
                  autoComplete="email"
                  placeholder="you@example.com"
                  invalid={Boolean(errors.email)}
                />
              )}
            </Field>

            <Field label="Password" error={errors.password} help="At least 8 characters.">
              {(id, describedBy) => (
                <PasswordInput
                  id={id}
                  aria-describedby={describedBy}
                  value={values.password}
                  onChange={set("password")}
                  autoComplete="new-password"
                  invalid={Boolean(errors.password)}
                />
              )}
            </Field>

            <Field label="City" hint="Optional">
              {(id) => (
                <Input
                  id={id}
                  value={values.city}
                  onChange={set("city")}
                  autoComplete="address-level2"
                  placeholder="Jaipur"
                />
              )}
            </Field>
          </>
        ) : (
          <>
            <div className="space-y-2.5 rounded-2xl border border-line bg-surface p-4">
              <p className="flex items-start gap-2.5 text-sm text-ink-soft">
                <Video className="mt-0.5 size-4 shrink-0 text-learn" aria-hidden />
                <span>
                  <span className="font-medium text-ink">All sessions run on video.</span>{" "}
                  Skill Swap never arranges meetings in person.
                </span>
              </p>
              <p className="flex items-start gap-2.5 text-sm text-ink-soft">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-learn" aria-hidden />
                <span>
                  <span className="font-medium text-ink">You can report or block</span>{" "}
                  anyone, from any profile or chat. Safety reports go to the top of the
                  moderation queue.
                </span>
              </p>
            </div>

            <Checkbox
              checked={values.ageConfirmed}
              onChange={set("ageConfirmed")}
              label={`I am ${MIN_AGE} or older`}
            />
            <FieldError>{errors.ageConfirmed}</FieldError>

            <Field label="Parent or guardian's name" error={errors.guardianName}>
              {(id, describedBy) => (
                <Input
                  id={id}
                  aria-describedby={describedBy}
                  value={values.guardianName}
                  onChange={set("guardianName")}
                  placeholder="Priya Sharma"
                  invalid={Boolean(errors.guardianName)}
                />
              )}
            </Field>

            <Field
              label="Parent or guardian's email"
              error={errors.guardianEmail}
              help="Used only to record consent. We never send marketing to this address."
            >
              {(id, describedBy) => (
                <Input
                  id={id}
                  type="email"
                  inputMode="email"
                  aria-describedby={describedBy}
                  value={values.guardianEmail}
                  onChange={set("guardianEmail")}
                  placeholder="parent@example.com"
                  invalid={Boolean(errors.guardianEmail)}
                />
              )}
            </Field>

            <Checkbox
              checked={values.guardianConsent}
              onChange={set("guardianConsent")}
              label="My parent or guardian gives consent for me to use Skill Swap"
              description={
                <>
                  They have read the{" "}
                  <Link href="/privacy" target="_blank" className="underline">
                    privacy policy
                  </Link>{" "}
                  and{" "}
                  <Link href="/terms" target="_blank" className="underline">
                    terms
                  </Link>
                  .
                </>
              }
            />
            <FieldError>{errors.guardianConsent}</FieldError>
          </>
        )}

        {formError ? (
          <div className="rounded-xl border border-danger/30 bg-danger-wash px-3.5 py-3">
            <FieldError>{formError}</FieldError>
          </div>
        ) : null}

        <div className="flex gap-2 pt-1">
          {step === "consent" ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep("account")}
              aria-label="Back to account details"
            >
              <ArrowLeft className="size-4" aria-hidden />
            </Button>
          ) : null}
          <Button type="submit" size="lg" fullWidth loading={submitting}>
            {step === "account" ? "Continue" : "Create account"}
          </Button>
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-ink underline underline-offset-2">
          Sign in
        </Link>
      </p>
    </div>
  );
}
