import { type ComponentProps } from "react";
import { cn } from "../../utils/cn";
import { focusRingClasses } from "../../primitives/FocusRing";

/** Id the layouts give their <main>, so SkipLink can point at it. */
export const MAIN_CONTENT_ID = "main-content";

export type SkipLinkProps = ComponentProps<"a">;

/**
 * "Skip to main content": invisible until a keyboard user tabs to it, then
 * pinned to the top left. Render it first in the page.
 */
export function SkipLink({
  href = `#${MAIN_CONTENT_ID}`,
  className,
  children = "Skip to main content",
  ref,
  ...props
}: SkipLinkProps) {
  return (
    <a
      ref={ref}
      href={href}
      className={cn(
        "sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[var(--z-toast)]",
        "focus:rounded-standard focus:bg-surface-card focus:px-4 focus:py-3 focus:font-body focus:text-body-md focus:font-medium focus:text-text-primary focus:shadow-floating",
        focusRingClasses,
        className,
      )}
      {...props}
    >
      {children}
    </a>
  );
}
