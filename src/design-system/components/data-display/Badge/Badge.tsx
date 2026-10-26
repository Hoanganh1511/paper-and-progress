import { type ComponentProps } from "react";
import { X, type LucideIcon } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../../utils/cn";
import { focusRingClasses } from "../../../primitives/FocusRing";

// Class names are written out in full so Tailwind can detect them statically.
const badgeVariants = cva(
  "inline-flex shrink-0 items-center rounded-pill border border-transparent font-body font-medium whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "border-border-default bg-surface-sunken text-text-primary",
        lime: "bg-accent-lime text-ink",
        pink: "bg-accent-pink text-ink",
        yellow: "bg-accent-yellow text-ink",
        blue: "bg-accent-blue text-ink",
        success: "bg-success-bg text-success-text",
        warning: "bg-warning-bg text-warning-text",
        danger: "bg-danger-bg text-danger-text",
      },
      size: {
        sm: "h-5 gap-1 px-2 text-caption",
        md: "h-6 gap-1.5 px-3 text-body-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export interface BadgeProps
  extends ComponentProps<"span">, VariantProps<typeof badgeVariants> {
  /** Small status dot before the label. */
  dot?: boolean;
  icon?: LucideIcon;
  removable?: boolean;
  onRemove?: () => void;
  /** Accessible name of the remove button. Defaults to "Remove <label>". */
  removeLabel?: string;
}

export function Badge({
  variant,
  size,
  dot = false,
  icon: Icon,
  removable = false,
  onRemove,
  removeLabel,
  className,
  children,
  ref,
  ...props
}: BadgeProps) {
  const iconSize = size === "sm" ? 12 : 14;
  const removeName =
    removeLabel ??
    (typeof children === "string" ? `Remove ${children}` : "Remove");

  return (
    <span
      ref={ref}
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    >
      {dot && (
        <span
          aria-hidden="true"
          className="size-1.5 shrink-0 rounded-pill bg-current"
        />
      )}
      {Icon && <Icon aria-hidden="true" size={iconSize} className="shrink-0" />}
      {children}
      {removable && (
        // The ::before pseudo-element extends the hit area to the 44px minimum.
        <button
          type="button"
          aria-label={removeName}
          onClick={onRemove}
          className={cn(
            "relative -mr-1 inline-flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-pill",
            "transition-colors duration-[var(--duration-fast)] hover:bg-black/10",
            "before:absolute before:top-1/2 before:left-1/2 before:size-full before:min-h-11 before:min-w-11 before:-translate-x-1/2 before:-translate-y-1/2",
            focusRingClasses,
          )}
        >
          <X aria-hidden="true" size={12} />
        </button>
      )}
    </span>
  );
}
