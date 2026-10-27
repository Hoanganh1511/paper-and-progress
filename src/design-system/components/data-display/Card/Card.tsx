import { type ComponentProps, type ElementType, type Ref } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../../utils/cn";
import { focusRingWithinClasses } from "../../../primitives/FocusRing";

// Class names are written out in full so Tailwind can detect them statically.
const cardVariants = cva("flex flex-col rounded-standard text-text-primary", {
  variants: {
    variant: {
      default: "border-2 border-border-strong bg-surface-card shadow-raised",
      outlined: "border-2 border-border-strong bg-transparent",
      elevated: "border-2 border-border-strong bg-surface-card shadow-floating",
      accent: "border-2 border-border-strong bg-surface-card shadow-accent",
    },
    padding: {
      none: "gap-0 p-0",
      compact: "gap-3 p-4",
      default: "gap-4 p-6",
    },
    interactive: {
      true: [
        "cursor-pointer transition-[transform,box-shadow] duration-[var(--duration-normal)] ease-[var(--ease-default)]",
        "hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        focusRingWithinClasses,
      ],
      false: "",
    },
  },
  compoundVariants: [
    {
      interactive: true,
      variant: ["default", "outlined"],
      className: "hover:shadow-floating",
    },
    {
      interactive: true,
      variant: "elevated",
      className: "hover:shadow-modal",
    },
  ],
  defaultVariants: {
    variant: "default",
    padding: "default",
    interactive: false,
  },
});

export type CardElement = "div" | "article" | "section" | "li";

export interface CardProps
  extends
    Omit<ComponentProps<"div">, "ref">,
    VariantProps<typeof cardVariants> {
  as?: CardElement;
  ref?: Ref<HTMLElement>;
}

/**
 * `interactive` only adds the hover and focus-within styling. Put the actual
 * action in a link or button inside the card (e.g. a stretched link with
 * `after:absolute after:inset-0` on a `relative` card) so it stays keyboard
 * accessible.
 */
export function Card({
  as: Component = "div",
  variant,
  padding,
  interactive,
  className,
  ref,
  ...props
}: CardProps) {
  const Tag = Component as ElementType;

  return (
    <Tag
      ref={ref}
      className={cn(cardVariants({ variant, padding, interactive }), className)}
      {...props}
    />
  );
}
