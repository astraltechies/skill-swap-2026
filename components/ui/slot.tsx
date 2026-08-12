import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Minimal `asChild` support — merges props onto a single child element so a
 * <Button asChild><Link/></Button> renders one anchor, not a nested pair.
 * Small enough not to justify pulling in Radix for this alone.
 *
 * Intentionally not a Client Component: it holds no state, and marking it
 * `"use client"` would put an RSC boundary between Button and its child, where
 * the child arrives as a serialized payload rather than an element to clone.
 */
export function Slot({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLElement> & { children?: ReactNode }) {
  if (!isValidElement(children)) return null;

  const child = children as ReactElement<Record<string, unknown>>;
  const childProps = child.props as { className?: string };

  return cloneElement(child, {
    ...props,
    className: cn(className, childProps.className),
  });
}
