import { type ComponentProps, type ElementType, type Ref } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../utils/cn";

const textVariants = cva("", {
  variants: {
    size: {
      "display-xl": "text-display-xl leading-[1.05] tracking-tight",
      "display-lg": "text-display-lg leading-[1.1] tracking-tight",
      "heading-xl": "text-heading-xl leading-[1.15] tracking-tight",
      "heading-lg": "text-heading-lg leading-[1.2]",
      "heading-md": "text-heading-md leading-[1.3]",
      "heading-sm": "text-heading-sm leading-[1.35]",
      "body-lg": "text-body-lg leading-relaxed",
      "body-md": "text-body-md leading-relaxed",
      "body-sm": "text-body-sm leading-normal",
      caption: "text-caption leading-normal",
      overline: "text-overline leading-normal uppercase tracking-widest",
    },
    weight: {
      light: "font-light",
      regular: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
    },
    color: {
      primary: "text-text-primary",
      secondary: "text-text-secondary",
      muted: "text-text-muted",
      disabled: "text-text-disabled",
      inverse: "text-text-inverse",
      success: "text-success-text",
      warning: "text-warning-text",
      danger: "text-danger-text",
      info: "text-info-text",
    },
    font: {
      display: "font-display",
      body: "font-body",
      handwritten: "font-handwritten",
    },
    align: {
      left: "text-left",
      center: "text-center",
      right: "text-right",
    },
    truncate: {
      true: "truncate",
      false: "",
    },
  },
  defaultVariants: {
    size: "body-md",
    weight: "regular",
    color: "primary",
    truncate: false,
  },
});

type TextSize = NonNullable<VariantProps<typeof textVariants>["size"]>;
type TextFont = NonNullable<VariantProps<typeof textVariants>["font"]>;

export type TextElement =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "p"
  | "span"
  | "label"
  | "blockquote";

export interface TextProps
  extends
    Omit<ComponentProps<"p">, "color" | "ref">,
    Omit<VariantProps<typeof textVariants>, "truncate"> {
  as?: TextElement;
  ref?: Ref<HTMLElement>;
  truncate?: boolean;
}

function getDefaultFont(size: TextSize): TextFont {
  return size.startsWith("display-") || size.startsWith("heading-")
    ? "display"
    : "body";
}

export function Text({
  as: Component = "p",
  size = "body-md",
  weight,
  color,
  font,
  align,
  truncate,
  className,
  ref,
  ...props
}: TextProps) {
  const Tag = Component as ElementType;

  return (
    <Tag
      ref={ref}
      className={cn(
        textVariants({
          size,
          weight,
          color,
          font: font ?? getDefaultFont(size ?? "body-md"),
          align,
          truncate,
        }),
        className,
      )}
      {...props}
    />
  );
}
