import { type ComponentProps } from "react";
import { type LucideIcon } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../utils/cn";

const iconVariants = cva("shrink-0", {
  variants: {
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
      "accent-lime": "text-accent-lime",
      "accent-pink": "text-accent-pink",
      "accent-yellow": "text-accent-yellow",
      "accent-blue": "text-accent-blue",
    },
  },
  defaultVariants: {
    color: "primary",
  },
});

export interface IconProps
  extends
    Omit<ComponentProps<"svg">, "color" | "children">,
    VariantProps<typeof iconVariants> {
  icon: LucideIcon;
  size?: 16 | 20 | 24 | 32;
  label?: string;
}

export function Icon({
  icon: IconComponent,
  size = 20,
  color,
  label,
  className,
  ref,
  ...props
}: IconProps) {
  return (
    <IconComponent
      ref={ref}
      size={size}
      className={cn(iconVariants({ color }), className)}
      {...(label
        ? { role: "img", "aria-label": label }
        : { "aria-hidden": true })}
      {...props}
    />
  );
}
