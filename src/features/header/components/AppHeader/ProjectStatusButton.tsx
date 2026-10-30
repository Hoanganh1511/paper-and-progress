import Link from "next/link";
import { HardHat } from "lucide-react";
import { cn, focusRingClasses } from "@/design-system";

export interface ProjectStatusButtonProps {
  href: string;
  label: string;
  /** The visitor is on the page the button leads to. */
  isCurrent?: boolean;
}

/**
 * A construction-sign style link: warm yellow body, outline, a hard offset
 * shadow and a black-and-yellow hazard stripe along the bottom edge. It is the
 * size of the header's other buttons. It lifts on hover and sinks when
 * pressed. Below `sm` only the hard hat shows; the label stays for screen
 * readers.
 */
export function ProjectStatusButton({
  href,
  label,
  isCurrent = false,
}: ProjectStatusButtonProps) {
  return (
    <Link
      href={href}
      aria-current={isCurrent ? "page" : undefined}
      className={cn(
        // 40px tall, 2px outline, 8px corners, 4px hard shadow: like a Button.
        "group relative inline-flex md:order-5 h-[var(--height-default)] shrink-0 items-center gap-2 overflow-hidden rounded-standard border-2 border-border-strong bg-accent-yellow pb-1 pl-3 text-ink max-sm:pr-3 sm:pr-4",
        // Hover moves it 2px into the shadow; pressed, the full 4px (none left).
        "shadow-accent transition-[translate,box-shadow] duration-150 ease-out",
        "hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_var(--color-border-strong)]",
        "active:translate-x-1 active:translate-y-1 active:shadow-none",
        "motion-reduce:transition-none",
        isCurrent && "translate-x-1 translate-y-1 shadow-none",
        focusRingClasses,
      )}
    >
      <HardHat
        aria-hidden="true"
        size={20}
        strokeWidth={2.25}
        className="shrink-0 fill-accent-yellow"
      />
      <span className="font-body text-body-md leading-none font-bold max-sm:sr-only">
        {label}
      </span>
      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-1 border-t-2 border-border-strong"
        style={{
          backgroundImage:
            "repeating-linear-gradient(-45deg, #171717 0 4px, #ffd15c 4px 8px)",
        }}
      />
    </Link>
  );
}
