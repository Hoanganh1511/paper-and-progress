import { type ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../utils/cn";

// Class names are written out in full so Tailwind can detect them statically.
/** Focus indicator for elements that are focusable themselves. */
export const focusRingClasses =
  "focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-border-focus focus-visible:outline-offset-2";

/** Focus indicator shown when any descendant has focus. */
export const focusRingWithinClasses =
  "focus-within:outline-2 focus-within:outline-solid focus-within:outline-border-focus focus-within:outline-offset-2";

const focusRingVariants = cva("", {
  variants: {
    within: {
      true: focusRingWithinClasses,
      false: focusRingClasses,
    },
  },
  defaultVariants: {
    within: false,
  },
});

export interface FocusRingProps
  extends ComponentProps<"div">, VariantProps<typeof focusRingVariants> {}

export function FocusRing({
  within,
  className,
  ref,
  ...props
}: FocusRingProps) {
  return (
    <div
      ref={ref}
      className={cn(focusRingVariants({ within }), className)}
      {...props}
    />
  );
}
