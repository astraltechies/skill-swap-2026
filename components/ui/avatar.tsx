import { cn, initialsOf } from "@/lib/utils";

const SIZES = {
  sm: "size-8 text-xs",
  md: "size-11 text-sm",
  lg: "size-16 text-lg",
  xl: "size-24 text-2xl",
} as const;

/**
 * Falls back to initials on a colour derived from the name, so a profile
 * without a photo still looks deliberate rather than broken.
 */
export function Avatar({
  name,
  src,
  size = "md",
  className,
}: {
  name: string;
  src?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const hue = [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 360;

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full",
        "border border-line font-medium",
        SIZES[size],
        className,
      )}
      style={src ? undefined : { background: `oklch(0.9 0.05 ${hue})`, color: `oklch(0.35 0.1 ${hue})` }}
    >
      {src ? (
        /* Avatars come from arbitrary Firebase Storage buckets and Google
           account CDNs, so routing them through next/image would mean
           allow-listing every possible host up front. They are small, already
           served from a CDN, and capped at 2MB by the storage rules. */
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="size-full object-cover" loading="lazy" />
      ) : (
        <span aria-hidden>{initialsOf(name)}</span>
      )}
    </span>
  );
}
