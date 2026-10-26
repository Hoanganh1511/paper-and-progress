import { type ComponentProps, type ElementType, type Ref } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../utils/cn";

const surfaceVariants = cva("text-text-primary", {
  variants: {
    variant: {
      page: "bg-surface-page",
      card: "bg-surface-card",
      overlay: "bg-surface-overlay",
      sunken: "bg-surface-sunken",
    },
    padding: {
      none: "p-0",
      compact: "p-3",
      default: "p-6",
      spacious: "p-8",
    },
    radius: {
      none: "rounded-none",
      sharp: "rounded-sharp",
      standard: "rounded-standard",
      soft: "rounded-soft",
    },
    elevation: {
      flat: "shadow-flat",
      raised: "shadow-raised",
      floating: "shadow-floating",
      modal: "shadow-modal",
      accent: "shadow-accent",
    },
    border: {
      none: "border-0",
      subtle: "border border-border-subtle",
      strong: "border border-border-strong",
    },
  },
  defaultVariants: {
    variant: "card",
    padding: "default",
    radius: "standard",
    elevation: "flat",
    border: "none",
  },
});

export type SurfaceElement =
  | "div"
  | "section"
  | "article"
  | "aside"
  | "main"
  | "header"
  | "footer"
  | "nav";

export interface SurfaceProps
  extends
    Omit<ComponentProps<"div">, "ref">,
    VariantProps<typeof surfaceVariants> {
  as?: SurfaceElement;
  ref?: Ref<HTMLElement>;
}

export function Surface({
  as: Component = "div",
  variant,
  padding,
  radius,
  elevation,
  border,
  className,
  ref,
  ...props
}: SurfaceProps) {
  const Tag = Component as ElementType;

  return (
    <Tag
      ref={ref}
      className={cn(
        surfaceVariants({ variant, padding, radius, elevation, border }),
        className,
      )}
      {...props}
    />
  );
}
