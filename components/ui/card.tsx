import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Card({
  className,
  children,
  as: Tag = "div",
  interactive = false,
}: {
  className?: string;
  children: ReactNode;
  as?: "div" | "article" | "section" | "li";
  /** Set when the whole card is a tap target — adds hover lift and press feedback. */
  interactive?: boolean;
}) {
  return (
    <Tag
      className={cn(
        "rounded-2xl border border-line bg-surface shadow-sm",
        interactive && [
          "pressable cursor-pointer",
          "transition-[box-shadow,border-color,transform] duration-(--duration-fast) ease-(--ease-out-quart)",
          "hover:-translate-y-0.5 hover:border-line-strong hover:shadow-md",
        ],
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("px-4 pt-4 sm:px-5 sm:pt-5", className)}>{children}</div>;
}

export function CardBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("px-4 py-4 sm:px-5 sm:py-5", className)}>{children}</div>;
}

export function CardFooter({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("border-t border-line px-4 py-3 sm:px-5", className)}>{children}</div>
  );
}

export function SectionHeading({
  title,
  action,
  subtitle,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-3 flex items-end justify-between gap-3", className)}>
      <div className="min-w-0">
        <h2 className="text-lg font-semibold tracking-tight sm:text-xl">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-sm text-muted">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line-strong px-6 py-10 text-center">
      {icon ? <div className="mb-3 text-muted">{icon}</div> : null}
      <h3 className="font-display text-base font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
