"use client";

import { Button } from "@/components/ui/button";
import { Checkbox, Field, FieldError, Input } from "@/components/ui/field";
import { MIN_AGE } from "@/lib/constants";
import { ShieldCheck, Video } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function CompleteSignupForm({
  defaultName,
  email,
}: {
  defaultName: string;
  email: string;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [values, setValues] = useState({
    displayName: defaultName,
    username: "",
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

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError("");

    const next: Record<string, string> = {};
    if (values.displayName.trim().length < 2) next.displayName = "Tell us your name.";
    if (!/^[a-z0-9_]{3,20}$/.test(values.username.trim().toLowerCase())) {
      next.username = "3–20 characters: letters, numbers and underscores.";
    }
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
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
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
          return;
        }
        throw new Error(data.error ?? "Could not finish setting up your account.");
      }

      router.push("/profile/edit?welcome=1");
      router.refresh();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
        Almost there
      </h1>
      <p className="mt-1.5 text-sm text-muted">
        Signed in as {email}. Two more things before you can book a session.
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
        <Field label="Your name" error={errors.displayName}>
          {(id) => (
            <Input
              id={id}
              value={values.displayName}
              onChange={set("displayName")}
              invalid={Boolean(errors.displayName)}
            />
          )}
        </Field>

        <Field
          label="Username"
          error={errors.username}
          help="This is your public profile link."
        >
          {(id) => (
            <Input
              id={id}
              value={values.username}
              onChange={set("username")}
              placeholder="aarav_s"
              invalid={Boolean(errors.username)}
            />
          )}
        </Field>

        <Field label="City" hint="Optional">
          {(id) => <Input id={id} value={values.city} onChange={set("city")} placeholder="Jaipur" />}
        </Field>

        <div className="space-y-2.5 rounded-2xl border border-line bg-surface p-4">
          <p className="flex items-start gap-2.5 text-sm text-ink-soft">
            <Video className="mt-0.5 size-4 shrink-0 text-learn" aria-hidden />
            <span>
              <span className="font-medium text-ink">All sessions run on video.</span> Skill
              Swap never arranges meetings in person.
            </span>
          </p>
          <p className="flex items-start gap-2.5 text-sm text-ink-soft">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-learn" aria-hidden />
            <span>
              <span className="font-medium text-ink">You can report or block</span> anyone,
              from any profile or chat.
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
          {(id) => (
            <Input
              id={id}
              value={values.guardianName}
              onChange={set("guardianName")}
              invalid={Boolean(errors.guardianName)}
            />
          )}
        </Field>

        <Field
          label="Parent or guardian's email"
          error={errors.guardianEmail}
          help="Used only to record consent."
        >
          {(id) => (
            <Input
              id={id}
              type="email"
              inputMode="email"
              value={values.guardianEmail}
              onChange={set("guardianEmail")}
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

        {formError ? (
          <div className="rounded-xl border border-danger/30 bg-danger-wash px-3.5 py-3">
            <FieldError>{formError}</FieldError>
          </div>
        ) : null}

        <Button type="submit" size="lg" fullWidth loading={submitting}>
          Finish setup
        </Button>
      </form>
    </div>
  );
}
