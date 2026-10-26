import { type ComponentProps } from "react";
import { type LucideIcon } from "lucide-react";
import { cn } from "../../../utils/cn";
import {
  buttonVariants,
  getButtonIconSize,
  type ButtonVariantProps,
} from "./buttonVariants";

export interface IconButtonProps
  extends
    Omit<ComponentProps<"button">, "children" | "aria-label">,
    Omit<ButtonVariantProps, "isFullWidth"> {
  icon: LucideIcon;
  "aria-label": string;
}

export function IconButton({
  icon: IconComponent,
  variant,
  size,
  type = "button",
  className,
  ref,
  ...props
}: IconButtonProps) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        buttonVariants({ variant, size }),
        "aspect-square px-0",
        className,
      )}
      {...props}
    >
      <IconComponent
        aria-hidden="true"
        size={getButtonIconSize(size)}
        className="shrink-0"
      />
    </button>
  );
}
