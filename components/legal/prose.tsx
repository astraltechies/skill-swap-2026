import type { ReactNode } from "react";

/**
 * Legal pages are read on a phone, usually by a parent, usually quickly.
 * Wider line height and a real measure matter more here than anywhere else.
 */
export function Prose({ children }: { children: ReactNode }) {
  return (
    <div
      className="
        mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12
        [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold
        [&_h3]:mt-6 [&_h3]:font-display [&_h3]:text-base [&_h3]:font-semibold
        [&_p]:mt-3 [&_p]:leading-relaxed [&_p]:text-ink-soft
        [&_ul]:mt-3 [&_ul]:space-y-2 [&_ul]:pl-5
        [&_li]:list-disc [&_li]:leading-relaxed [&_li]:text-ink-soft
        [&_a]:font-medium [&_a]:text-ink [&_a]:underline [&_a]:underline-offset-2
        [&_strong]:font-semibold [&_strong]:text-ink
      "
    >
      {children}
    </div>
  );
}
