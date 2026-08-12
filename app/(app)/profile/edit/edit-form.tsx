"use client";

import { SkillPicker } from "@/components/profile/skill-picker";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Field, FieldError, Input, Textarea } from "@/components/ui/field";
import { DAY_NAMES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type {
  AvailabilityWindow,
  Skill,
  SkillCategory,
  SkillRef,
  UserProfile,
} from "@/types/firestore";
import { Check, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const BIO_MAX = 400;

export function ProfileEditForm({
  user,
  skills,
  categories,
}: {
  user: UserProfile;
  skills: Skill[];
  categories: SkillCategory[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [displayName, setDisplayName] = useState(user.displayName);
  const [bio, setBio] = useState(user.bio);
  const [city, setCity] = useState(user.city);
  const [skillsTeach, setSkillsTeach] = useState<SkillRef[]>(user.skillsTeach);
  const [skillsLearn, setSkillsLearn] = useState<SkillRef[]>(user.skillsLearn);
  const [availability, setAvailability] = useState<AvailabilityWindow[]>(user.availability);

  function addWindow() {
    setAvailability((a) => [...a, { day: 6, start: "16:00", end: "18:00" }]);
  }

  function updateWindow(index: number, patch: Partial<AvailabilityWindow>) {
    setAvailability((a) => a.map((w, i) => (i === index ? { ...w, ...patch } : w)));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSaved(false);

    const invalid = availability.find((w) => w.start >= w.end);
    if (invalid) {
      setError("Each availability window needs to end after it starts.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim(),
          bio: bio.trim(),
          city: city.trim(),
          skillsTeach,
          skillsLearn,
          availability,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not save your profile.");
      }

      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-4">
      <Card>
        <CardBody className="space-y-4">
          <Field label="Your name">
            {(id) => (
              <Input id={id} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            )}
          </Field>

          <Field
            label="About you"
            hint={`${bio.length}/${BIO_MAX}`}
            help="A line or two. What you're into, what year you're in."
          >
            {(id) => (
              <Textarea
                id={id}
                value={bio}
                maxLength={BIO_MAX}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Class 11. I've been playing guitar for three years and I like teaching people their first song."
              />
            )}
          </Field>

          <Field label="City" hint="Optional">
            {(id) => <Input id={id} value={city} onChange={(e) => setCity(e.target.value)} />}
          </Field>
        </CardBody>
      </Card>

      {/* The two halves of the swap, laid out the same way the SwapCard shows
          them, so the editor and the result look like the same object. */}
      <section>
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-teach-ink">I can teach</h2>
          <span className="text-xs text-muted">{skillsTeach.length}/10</span>
        </div>
        <p className="mb-3 text-sm text-muted">
          Anything you could walk someone through for half an hour. You do not need to be an
          expert.
        </p>
        <SkillPicker
          mode="teach"
          value={skillsTeach}
          onChange={setSkillsTeach}
          skills={skills}
          categories={categories}
        />
      </section>

      <section>
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-learn-ink">
            I want to learn
          </h2>
          <span className="text-xs text-muted">{skillsLearn.length}/10</span>
        </div>
        <p className="mb-3 text-sm text-muted">
          This is what we match on, so be honest rather than impressive.
        </p>
        <SkillPicker
          mode="learn"
          value={skillsLearn}
          onChange={setSkillsLearn}
          skills={skills}
          categories={categories}
        />
      </section>

      <section>
        <h2 className="mb-2 font-display text-lg font-semibold">When you&apos;re free</h2>
        <p className="mb-3 text-sm text-muted">
          Optional, but people with overlapping free time show higher in each other&apos;s
          matches.
        </p>

        {availability.length > 0 ? (
          <ul className="mb-3 space-y-2">
            {availability.map((window, index) => (
              <li
                key={index}
                className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface p-2.5"
              >
                <select
                  value={window.day}
                  onChange={(e) => updateWindow(index, { day: Number(e.target.value) })}
                  aria-label="Day"
                  className="h-10 rounded-lg border border-line-strong bg-surface px-2 text-sm"
                >
                  {DAY_NAMES.map((name, day) => (
                    <option key={day} value={day}>
                      {name}
                    </option>
                  ))}
                </select>

                <input
                  type="time"
                  value={window.start}
                  onChange={(e) => updateWindow(index, { start: e.target.value })}
                  aria-label="From"
                  className="h-10 rounded-lg border border-line-strong bg-surface px-2 text-sm"
                />
                <span className="text-sm text-muted">to</span>
                <input
                  type="time"
                  value={window.end}
                  onChange={(e) => updateWindow(index, { end: e.target.value })}
                  aria-label="Until"
                  className="h-10 rounded-lg border border-line-strong bg-surface px-2 text-sm"
                />

                <button
                  type="button"
                  onClick={() => setAvailability((a) => a.filter((_, i) => i !== index))}
                  className="ml-auto rounded-lg p-2 text-muted transition-colors hover:bg-surface-sunk hover:text-danger"
                  aria-label="Remove this window"
                >
                  <X className="size-4" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {availability.length < 14 ? (
          <Button type="button" variant="outline" size="sm" onClick={addWindow}>
            <Plus className="size-4" aria-hidden />
            Add a time
          </Button>
        ) : null}
      </section>

      {error ? (
        <div className="rounded-xl border border-danger/30 bg-danger-wash px-3.5 py-3">
          <FieldError>{error}</FieldError>
        </div>
      ) : null}

      {/* Sticky on mobile so Save is always in reach on a long form. */}
      <div
        className={cn(
          "sticky bottom-20 z-20 -mx-4 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur",
          "sm:-mx-6 sm:px-6 md:bottom-0",
        )}
      >
        <div className="flex items-center gap-3">
          <Button type="submit" size="lg" loading={saving} className="flex-1 sm:flex-none">
            Save profile
          </Button>
          {saved ? (
            <span className="flex items-center gap-1.5 text-sm text-success">
              <Check className="size-4" aria-hidden />
              Saved
            </span>
          ) : null}
        </div>
      </div>
    </form>
  );
}
