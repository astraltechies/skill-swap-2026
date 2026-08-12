"use client";

import { Input } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import type { SkillCategory } from "@/types/firestore";
import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

export function BrowseFilters({
  categories,
  activeCategory,
  query,
}: {
  categories: SkillCategory[];
  activeCategory: string;
  query: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [text, setText] = useState(query);

  function apply(next: { q?: string; category?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    startTransition(() => router.replace(`/browse?${params.toString()}`, { scroll: false }));
  }

  // Debounced so typing does not fire a navigation per keystroke.
  useEffect(() => {
    if (text === query) return;
    const timer = setTimeout(() => apply({ q: text, category: activeCategory }), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted"
          aria-hidden
        />
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Search a skill, name or city"
          className="pl-10 pr-10"
          aria-label="Search"
        />
        {text ? (
          <button
            type="button"
            onClick={() => setText("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-muted hover:text-ink"
            aria-label="Clear search"
          >
            <X className="size-4" aria-hidden />
          </button>
        ) : null}
      </div>

      {/* Horizontally scrolling chips — the standard phone pattern for a filter
          row that will not fit. */}
      <div className="-mx-4 overflow-x-auto px-4 no-scrollbar sm:-mx-6 sm:px-6">
        <div className="flex w-max gap-2 pb-1">
          <FilterChip
            label="All"
            active={!activeCategory}
            onClick={() => apply({ q: text, category: "" })}
          />
          {categories.map((category) => (
            <FilterChip
              key={category.id}
              label={`${category.emoji} ${category.name}`}
              active={activeCategory === category.id}
              onClick={() =>
                apply({
                  q: text,
                  category: activeCategory === category.id ? "" : category.id,
                })
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "shrink-0 rounded-full border px-3.5 py-2 text-sm transition-colors",
        active
          ? "border-ink bg-ink text-paper"
          : "border-line-strong bg-surface text-ink-soft hover:bg-surface-sunk",
      )}
    >
      {label}
    </button>
  );
}
