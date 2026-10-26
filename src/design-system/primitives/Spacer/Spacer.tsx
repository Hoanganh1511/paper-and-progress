import { type ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../utils/cn";

// Class names are written out in full so Tailwind can detect them statically.
const spacerVariants = cva("shrink-0", {
  variants: {
    size: {
      1: "",
      2: "",
      3: "",
      4: "",
      5: "",
      6: "",
      8: "",
      12: "",
      16: "",
      24: "",
    },
    axis: {
      vertical: "block",
      horizontal: "inline-block",
    },
  },
  compoundVariants: [
    { axis: "vertical", size: 1, className: "h-1" },
    { axis: "vertical", size: 2, className: "h-2" },
    { axis: "vertical", size: 3, className: "h-3" },
    { axis: "vertical", size: 4, className: "h-4" },
    { axis: "vertical", size: 5, className: "h-5" },
    { axis: "vertical", size: 6, className: "h-6" },
    { axis: "vertical", size: 8, className: "h-8" },
    { axis: "vertical", size: 12, className: "h-12" },
    { axis: "vertical", size: 16, className: "h-16" },
    { axis: "vertical", size: 24, className: "h-24" },
    { axis: "horizontal", size: 1, className: "w-1" },
    { axis: "horizontal", size: 2, className: "w-2" },
    { axis: "horizontal", size: 3, className: "w-3" },
    { axis: "horizontal", size: 4, className: "w-4" },
    { axis: "horizontal", size: 5, className: "w-5" },
    { axis: "horizontal", size: 6, className: "w-6" },
    { axis: "horizontal", size: 8, className: "w-8" },
    { axis: "horizontal", size: 12, className: "w-12" },
    { axis: "horizontal", size: 16, className: "w-16" },
    { axis: "horizontal", size: 24, className: "w-24" },
  ],
  defaultVariants: {
    size: 4,
    axis: "vertical",
  },
});

export interface SpacerProps
  extends
    Omit<ComponentProps<"div">, "children">,
    VariantProps<typeof spacerVariants> {}

export function Spacer({ size, axis, className, ref, ...props }: SpacerProps) {
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn(spacerVariants({ size, axis }), className)}
      {...props}
    />
  );
}
