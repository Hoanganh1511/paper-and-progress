import { type ComponentProps, type ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { cn, focusRingClasses } from "@/design-system";

export interface FooterLinkProps extends Omit<
  ComponentProps<"a">,
  "target" | "rel"
> {
  href: string;
  /** Icon before the text; decorative, so keep it free of its own label. */
  icon?: ReactNode;
  /** Screen-reader hint that the link opens in a new tab. */
  externalLabel?: string;
}

/**
 * A link to another site, opening in a new tab. A small arrow marks it as
 * external for sighted users and a hidden hint does the same for screen
 * readers. The row is at least 44px tall for touch.
 */
export function FooterLink({
  href,
  icon,
  externalLabel = "(mở trong tab mới)",
  className,
  children,
  ref,
  ...props
}: FooterLinkProps) {
  return (
    <a
      ref={ref}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group inline-flex min-h-11 items-center gap-2 rounded-sharp font-body text-body-md font-medium text-text-primary",
        "hover:underline hover:underline-offset-4",
        focusRingClasses,
        className,
      )}
      {...props}
    >
      {icon && (
        <span aria-hidden="true" className="inline-flex shrink-0">
          {icon}
        </span>
      )}
      <span>{children}</span>
      <ArrowUpRight
        aria-hidden="true"
        size={16}
        className="shrink-0 transition-transform duration-[var(--duration-fast)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0 motion-reduce:group-hover:translate-y-0"
      />
      <span className="sr-only">{` ${externalLabel}`}</span>
    </a>
  );
}
