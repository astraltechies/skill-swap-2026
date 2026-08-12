"use client";

import { cn } from "@/lib/utils";
import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

export const THEME_KEY = "skillswap-theme";

type Theme = "light" | "dark";

/**
 * The theme lives on `<html data-theme>`, written before first paint by the
 * inline script in the root layout. That makes it external state as far as
 * React is concerned, so it is read with `useSyncExternalStore` rather than
 * copied into component state.
 *
 * Two useful properties fall out of that: the server snapshot is always
 * "light" (the default), so hydration never mismatches; and because every
 * instance subscribes to the same attribute, the toggle in the top bar and the
 * one in the sidebar stay in step without any shared context.
 */
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

function getSnapshot(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function getServerSnapshot(): Theme {
  return "light";
}

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const next: Theme = theme === "dark" ? "light" : "dark";

  function toggle() {
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // Private mode or blocked storage — the switch still works for this visit.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      className={cn(
        "pressable relative inline-flex size-9 items-center justify-center rounded-xl",
        "text-muted transition-colors duration-(--duration-fast)",
        "hover:bg-surface-sunk hover:text-ink",
        className,
      )}
    >
      {/* Both icons are always mounted and cross-fade, so the button never
          changes size and nothing jumps as the theme flips. */}
      <Sun
        className={cn(
          "absolute size-[18px] transition-all duration-(--duration-base) ease-(--ease-out-quart)",
          theme === "dark" ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100",
        )}
        aria-hidden
      />
      <Moon
        className={cn(
          "absolute size-[18px] transition-all duration-(--duration-base) ease-(--ease-out-quart)",
          theme === "dark" ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0",
        )}
        aria-hidden
      />
    </button>
  );
}
