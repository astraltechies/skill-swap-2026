"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { SKILL_LEVELS, type Skill, type SkillCategory, type SkillLevel, type SkillRef } from "@/types/firestore";
import { Check, Plus, Search, X } from "lucide-react";
import { useMemo, useState } from "react";

const LEVEL_LABEL: Record<SkillLevel, string> = {
  beginner: "Just started",
  intermediate: "Comfortable",
  advanced: "Can teach it well",
};

export function SkillPicker({
  mode,
  value,
  onChange,
  skills,
  categories,
  max = 10,
}: {
  mode: "teach" | "learn";
  value: SkillRef[];
  onChange: (next: SkillRef[]) => void;
  skills: Skill[];
  categories: SkillCategory[];
  max?: number;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const skillsById = useMemo(() => new Map(skills.map((s) => [s.id, s])), [skills]);
  const chosen = useMemo(() => new Set(value.map((v) => v.skillId)), [value]);

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matching = q
      ? skills.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.tags.some((t) => t.toLowerCase().includes(q)),
        )
      : skills;

    return categories
      .map((category) => ({
        category,
        items: matching.filter((s) => s.categoryId === category.id),
      }))
      .filter((group) => group.items.length > 0);
  }, [categories, skills, query]);

  const tone = mode === "teach" ? "teach" : "learn";
  const atMax = value.length >= max;

  function add(skillId: string) {
    if (atMax || chosen.has(skillId)) return;
    onChange([...value, { skillId, level: mode === "teach" ? "intermediate" : "beginner" }]);
  }

  function remove(skillId: string) {
    onChange(value.filter((v) => v.skillId !== skillId));
  }

  function setLevel(skillId: string, level: SkillLevel) {
    onChange(value.map((v) => (v.skillId === skillId ? { ...v, level } : v)));
  }

  return (
    <div className="space-y-3">
      {value.length > 0 ? (
        <ul className="space-y-2">
          {value.map((ref) => {
            const skill = skillsById.get(ref.skillId);
            return (
              <li
                key={ref.skillId}
                className={cn(
                  "flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border px-3 py-2.5",
                  tone === "teach"
                    ? "border-teach/30 bg-teach-wash"
                    : "border-learn/30 bg-learn-wash",
                )}
              >
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {skill?.name ?? ref.skillId}
                </span>

                {/* Level only matters for teaching — for learning, everyone
                    starts where they start. */}
                {mode === "teach" ? (
                  <div className="flex gap-1" role="group" aria-label={`Your level in ${skill?.name}`}>
                    {SKILL_LEVELS.map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setLevel(ref.skillId, level)}
                        aria-pressed={ref.level === level}
                        title={LEVEL_LABEL[level]}
                        className={cn(
                          "rounded-lg px-2 py-1 text-xs transition-colors",
                          ref.level === level
                            ? "bg-teach text-[#3d2500] font-medium"
                            : "text-muted hover:bg-surface",
                        )}
                      >
                        {level === "beginner" ? "•" : level === "intermediate" ? "••" : "•••"}
                        <span className="sr-only">{LEVEL_LABEL[level]}</span>
                      </button>
                    ))}
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={() => remove(ref.skillId)}
                  className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface hover:text-danger"
                  aria-label={`Remove ${skill?.name ?? "skill"}`}
                >
                  <X className="size-4" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {open ? (
        <div className="rounded-xl border border-line bg-surface">
          <div className="relative border-b border-line p-2">
            <Search
              className="pointer-events-none absolute left-5 top-1/2 size-4 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search skills"
              className="border-0 pl-9 focus:ring-0"
              autoFocus
              aria-label="Search skills"
            />
          </div>

          <div className="max-h-72 overflow-y-auto overscroll-contain p-2">
            {grouped.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-muted">
                Nothing matches “{query}”.
              </p>
            ) : (
              grouped.map(({ category, items }) => (
                <div key={category.id} className="mb-3 last:mb-0">
                  <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted">
                    {category.emoji} {category.name}
                  </p>
                  <ul>
                    {items.map((skill) => {
                      const already = chosen.has(skill.id);
                      return (
                        <li key={skill.id}>
                          <button
                            type="button"
                            onClick={() => add(skill.id)}
                            disabled={already || atMax}
                            className={cn(
                              "flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left text-sm",
                              "transition-colors disabled:opacity-50",
                              !already && !atMax && "hover:bg-surface-sunk",
                            )}
                          >
                            <span className="min-w-0 truncate">{skill.name}</span>
                            {already ? (
                              <Check className="size-4 shrink-0 text-success" aria-hidden />
                            ) : (
                              <Plus className="size-4 shrink-0 text-muted" aria-hidden />
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-line p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              fullWidth
              onClick={() => {
                setOpen(false);
                setQuery("");
              }}
            >
              Done
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          disabled={atMax}
        >
          <Plus className="size-4" aria-hidden />
          {value.length === 0
            ? mode === "teach"
              ? "Add something you can teach"
              : "Add something you want to learn"
            : "Add another"}
        </Button>
      )}

      {atMax ? (
        <p className="text-xs text-muted">
          That&apos;s the maximum of {max}. Remove one to add another.
        </p>
      ) : null}
    </div>
  );
}
