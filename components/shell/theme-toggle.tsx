"use client";

import { cn } from "@/lib/utils";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export const THEME_KEY = "skillswap-theme";

type Theme = "light" | "dark";

function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Private mode or blocked storage — the toggle still works for this visit.
  }
}

export function ThemeToggle({ className }: { className?: string }) {
  // Starts undefined rather than "light": the real value only exists in the
  // DOM (set pre-paint by the inline script), and guessing here would render
  // the wrong icon for a split second on every load for dark-mode users.
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    apply(next);
    setTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      // Until the effect has run we know neither state, so describe the control
      // generically rather than announcing a state that might be wrong.
      aria-label={theme ? `Switch to ${theme === "dark" ? "light" : "dark"} mode` : "Switch theme"}
      className={cn(
        "pressable inline-flex size-9 items-center justify-center rounded-xl",
        "text-muted transition-colors duration-(--duration-fast)",
        "hover:bg-surface-sunk hover:text-ink",
        className,
      )}
    >
      {/* Both icons render and cross-fade, so there is no layout shift and no
          flash of the wrong glyph before the effect resolves. */}
      <Sun
        className={cn(
          "absolute size-[18px] transition-all duration-(--duration-base) ease-(--ease-out-quart)",
          theme === "dark" ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100",
        )}
        aria-hidden
      />
      <Moon
        className={cn(
          "size-[18px] transition-all duration-(--duration-base) ease-(--ease-out-quart)",
          theme === "dark" ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0",
        )}
        aria-hidden
      />
    </button>
  );
}
