import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function PageContainer({
  className,
  children,
  width = "default",
}: {
  className?: string;
  children: ReactNode;
  width?: "default" | "narrow" | "wide";
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 py-5 sm:px-6 sm:py-7",
        width === "narrow" && "max-w-2xl",
        width === "default" && "max-w-4xl",
        width === "wide" && "max-w-6xl",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
  eyebrow,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4 sm:mb-6">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-muted">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1.5 text-sm text-muted sm:text-base">{subtitle}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
