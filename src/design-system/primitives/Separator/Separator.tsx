import { type ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../utils/cn";

const separatorVariants = cva("shrink-0", {
  variants: {
    orientation: {
      horizontal: "h-px w-full",
      vertical: "w-px self-stretch",
    },
    variant: {
      subtle: "bg-border-subtle",
      strong: "bg-border-strong",
    },
  },
  defaultVariants: {
    orientation: "horizontal",
    variant: "subtle",
  },
});

export interface SeparatorProps
  extends
    Omit<ComponentProps<"div">, "children">,
    VariantProps<typeof separatorVariants> {}

export function Separator({
  orientation,
  variant,
  className,
  ref,
  ...props
}: SeparatorProps) {
  const resolvedOrientation = orientation ?? "horizontal";

  return (
    <div
      ref={ref}
      role="separator"
      aria-orientation={resolvedOrientation}
      className={cn(
        separatorVariants({ orientation: resolvedOrientation, variant }),
        className,
      )}
      {...props}
    />
  );
}
