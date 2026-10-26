import { type ComponentProps, type ElementType, type Ref } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../utils/cn";

const stackVariants = cva("flex flex-col", {
  variants: {
    gap: {
      1: "gap-1",
      2: "gap-2",
      3: "gap-3",
      4: "gap-4",
      5: "gap-5",
      6: "gap-6",
      8: "gap-8",
      12: "gap-12",
      16: "gap-16",
      24: "gap-24",
    },
    align: {
      start: "items-start",
      center: "items-center",
      end: "items-end",
      stretch: "items-stretch",
    },
  },
  defaultVariants: {
    gap: 4,
    align: "stretch",
  },
});

export type StackElement = "div" | "section" | "ul" | "ol" | "nav" | "form";

export interface StackProps
  extends
    Omit<ComponentProps<"div">, "ref">,
    VariantProps<typeof stackVariants> {
  as?: StackElement;
  ref?: Ref<HTMLElement>;
}

export function Stack({
  as: Component = "div",
  gap,
  align,
  className,
  ref,
  ...props
}: StackProps) {
  const Tag = Component as ElementType;

  return (
    <Tag
      ref={ref}
      className={cn(stackVariants({ gap, align }), className)}
      {...props}
    />
  );
}
