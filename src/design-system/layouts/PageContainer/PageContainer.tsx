import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../utils/cn";
import { Container, type ContainerProps } from "../../primitives/Container";

// Class names are written out in full so Tailwind can detect them statically.
const pageContainerVariants = cva("", {
  variants: {
    spacing: {
      compact: "py-4 md:py-6",
      default: "py-6 md:py-8",
      spacious: "py-8 md:py-12",
    },
  },
  defaultVariants: {
    spacing: "default",
  },
});

export interface PageContainerProps
  extends ContainerProps, VariantProps<typeof pageContainerVariants> {}

/** A Container with vertical page padding that grows from mobile to desktop. */
export function PageContainer({
  spacing,
  className,
  ...props
}: PageContainerProps) {
  return (
    <Container
      className={cn(pageContainerVariants({ spacing }), className)}
      {...props}
    />
  );
}
