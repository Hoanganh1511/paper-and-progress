import { type ComponentProps } from "react";
import { LoaderCircle } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../../utils/cn";

const spinnerVariants = cva("inline-flex shrink-0", {
  variants: {
    size: {
      sm: "size-4",
      md: "size-6",
      lg: "size-8",
      xl: "size-12",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export interface SpinnerProps
  extends
    Omit<ComponentProps<"span">, "children" | "role">,
    VariantProps<typeof spinnerVariants> {
  /** Text announced to assistive technology. */
  label?: string;
}

/**
 * An indeterminate loading indicator that takes the current text color.
 * It is a polite status region; with reduced motion it stays still and the
 * label carries the meaning.
 */
export function Spinner({
  size,
  label = "Loading",
  className,
  ref,
  ...props
}: SpinnerProps) {
  return (
    <span
      ref={ref}
      role="status"
      className={cn(spinnerVariants({ size }), className)}
      {...props}
    >
      <LoaderCircle
        aria-hidden="true"
        className="size-full animate-spin motion-reduce:animate-none"
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}
