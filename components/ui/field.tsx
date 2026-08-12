"use client";

import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";
import { useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";

/**
 * Inputs are 16px on mobile on purpose — anything smaller makes iOS Safari
 * zoom the viewport when the field takes focus.
 */
const CONTROL =
  "w-full rounded-xl border bg-surface px-3.5 text-base text-ink " +
  "placeholder:text-muted transition-colors " +
  "focus:border-learn focus:outline-none focus:ring-2 focus:ring-learn/25 " +
  "disabled:bg-surface-sunk disabled:text-muted";

export function Label({
  htmlFor,
  children,
  hint,
  className,
}: {
  htmlFor?: string;
  children: ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn("flex items-baseline justify-between gap-2 text-sm font-medium text-ink", className)}
    >
      <span>{children}</span>
      {hint ? <span className="text-xs font-normal text-muted">{hint}</span> : null}
    </label>
  );
}

export function FieldError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <p className="flex items-start gap-1.5 text-sm text-danger" role="alert">
      <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  help?: string;
  children: (id: string, describedBy: string | undefined) => ReactNode;
}

/** Wires label, help text and error message to the control's aria attributes. */
export function Field({ label, hint, error, help, children }: FieldProps) {
  const id = useId();
  const helpId = help ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} hint={hint}>
        {label}
      </Label>
      {children(id, describedBy)}
      {help && !error ? (
        <p id={helpId} className="text-xs text-muted">
          {help}
        </p>
      ) : null}
      {/* A div, not a p: FieldError renders its own <p role="alert">, and a
          nested paragraph gets auto-closed by the parser — which left this id
          on an empty element and silently broke aria-describedby everywhere. */}
      {error ? (
        <div id={errorId}>
          <FieldError>{error}</FieldError>
        </div>
      ) : null}
    </div>
  );
}

export function Input({
  className,
  invalid,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      className={cn(
        CONTROL,
        "h-11",
        invalid ? "border-danger focus:border-danger focus:ring-danger/25" : "border-line-strong",
        className,
      )}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
}

export function Textarea({
  className,
  invalid,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <textarea
      className={cn(
        CONTROL,
        "min-h-24 resize-y py-2.5 leading-relaxed",
        invalid ? "border-danger focus:border-danger focus:ring-danger/25" : "border-line-strong",
        className,
      )}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
}

export function Select({
  className,
  invalid,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <select
      className={cn(
        CONTROL,
        "h-11 appearance-none bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat pr-10",
        "bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 stroke=%22%236e6e78%22 stroke-width=%222%22 viewBox=%220 0 24 24%22><path d=%22M6 9l6 6 6-6%22/></svg>')]",
        invalid ? "border-danger" : "border-line-strong",
        className,
      )}
      aria-invalid={invalid || undefined}
      {...props}
    >
      {children}
    </select>
  );
}

export function Checkbox({
  className,
  label,
  description,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode; description?: ReactNode }) {
  const id = useId();
  return (
    <div className="flex items-start gap-3">
      <input
        id={id}
        type="checkbox"
        className={cn(
          "mt-0.5 size-5 shrink-0 cursor-pointer rounded-md border-line-strong text-learn",
          "accent-[var(--learn)] focus-visible:ring-2 focus-visible:ring-learn/30",
          className,
        )}
        {...props}
      />
      <label htmlFor={id} className="cursor-pointer text-sm leading-snug text-ink-soft">
        <span className="font-medium text-ink">{label}</span>
        {description ? <span className="mt-0.5 block text-muted">{description}</span> : null}
      </label>
    </div>
  );
}
