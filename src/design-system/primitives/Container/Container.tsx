import { type ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../utils/cn";

const containerVariants = cva("mx-auto w-full px-4 sm:px-6 lg:px-8", {
  variants: {
    size: {
      narrow: "max-w-[var(--width-container-narrow)]",
      default: "max-w-[var(--width-container-default)]",
      wide: "max-w-[var(--width-container-wide)]",
      full: "max-w-full",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

export interface ContainerProps
  extends ComponentProps<"div">, VariantProps<typeof containerVariants> {}

export function Container({ size, className, ref, ...props }: ContainerProps) {
  return (
    <div
      ref={ref}
      className={cn(containerVariants({ size }), className)}
      {...props}
    />
  );
}
