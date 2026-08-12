import { Slot } from "@/components/ui/slot";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "teach" | "learn" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-ink text-paper hover:bg-ink/90 active:bg-ink/80 disabled:bg-ink/40",
  teach:
    "bg-teach text-[#3d2500] hover:bg-teach-strong hover:text-white active:brightness-95 disabled:opacity-50",
  learn:
    "bg-learn text-white hover:bg-learn-strong active:brightness-95 disabled:opacity-50",
  outline:
    "border border-line-strong bg-surface text-ink hover:bg-surface-sunk active:bg-surface-sunk",
  ghost: "text-ink-soft hover:bg-surface-sunk hover:text-ink active:bg-surface-sunk",
  danger: "bg-danger text-white hover:brightness-110 active:brightness-95",
};

// Every size clears 44px on its primary axis — these are thumb targets first.
const SIZES: Record<Size, string> = {
  sm: "h-9 px-3 text-sm gap-1.5 rounded-lg",
  md: "h-11 px-4 text-[0.9375rem] gap-2 rounded-xl",
  lg: "h-12 px-6 text-base gap-2 rounded-xl",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  asChild?: boolean;
  fullWidth?: boolean;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  loading = false,
  asChild = false,
  fullWidth = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      className={cn(
        "inline-flex items-center justify-center font-medium",
        "transition-[background-color,color,transform,opacity] duration-150",
        "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60",
        "select-none whitespace-nowrap",
        VARIANTS[variant],
        SIZES[size],
        fullWidth && "w-full",
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden />
          <span>Working…</span>
        </>
      ) : (
        children
      )}
    </Comp>
  );
}
