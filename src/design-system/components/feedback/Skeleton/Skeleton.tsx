import { type ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../../utils/cn";

// Class names are written out in full so Tailwind can detect them statically.
// The sizes are only defaults: set the real dimensions with `className`
// (e.g. "h-6 w-1/2" or "size-16"), which overrides them.
const skeletonVariants = cva(
  "bg-border-subtle animate-pulse motion-reduce:animate-none",
  {
    variants: {
      variant: {
        text: "h-4 w-full rounded-sharp",
        circle: "size-10 rounded-pill",
        rect: "h-24 w-full rounded-standard",
      },
    },
    defaultVariants: {
      variant: "text",
    },
  },
);

export interface SkeletonProps
  extends ComponentProps<"div">, VariantProps<typeof skeletonVariants> {}

/**
 * A placeholder shape shown while content loads. It is hidden from assistive
 * technology: mark the loading region with `aria-busy="true"` (or show a
 * Spinner with a label) so the loading state is announced once.
 */
export function Skeleton({ variant, className, ref, ...props }: SkeletonProps) {
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn(skeletonVariants({ variant }), className)}
      {...props}
    />
  );
}
