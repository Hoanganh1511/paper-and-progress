import { type ComponentProps, type ElementType, type Ref } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../utils/cn";

const inlineVariants = cva("flex flex-row", {
  variants: {
    gap: {
      1: "gap-1",
      2: "gap-2",
      3: "gap-3",
      4: "gap-4",
      5: "gap-5",
      6: "gap-6",
      8: "gap-8",
    },
    align: {
      start: "items-start",
      center: "items-center",
      end: "items-end",
      baseline: "items-baseline",
    },
    justify: {
      start: "justify-start",
      center: "justify-center",
      end: "justify-end",
      between: "justify-between",
    },
    wrap: {
      true: "flex-wrap",
      false: "flex-nowrap",
    },
  },
  defaultVariants: {
    gap: 2,
    align: "center",
    justify: "start",
    wrap: true,
  },
});

export type InlineElement = "div" | "nav" | "ul";

export interface InlineProps
  extends
    Omit<ComponentProps<"div">, "ref">,
    VariantProps<typeof inlineVariants> {
  as?: InlineElement;
  ref?: Ref<HTMLElement>;
}

export function Inline({
  as: Component = "div",
  gap,
  align,
  justify,
  wrap,
  className,
  ref,
  ...props
}: InlineProps) {
  const Tag = Component as ElementType;

  return (
    <Tag
      ref={ref}
      className={cn(inlineVariants({ gap, align, justify, wrap }), className)}
      {...props}
    />
  );
}
