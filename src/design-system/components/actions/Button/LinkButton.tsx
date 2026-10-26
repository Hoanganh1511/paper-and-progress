import { type ComponentProps } from "react";
import { type LucideIcon } from "lucide-react";
import { cn } from "../../../utils/cn";
import {
  buttonVariants,
  getButtonIconSize,
  type ButtonVariantProps,
} from "./buttonVariants";

export interface LinkButtonProps
  extends Omit<ComponentProps<"a">, "href">, ButtonVariantProps {
  href: string;
  external?: boolean;
  /** Screen-reader text added when `external` is set (translate it for other languages). */
  externalLabel?: string;
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
}

export function LinkButton({
  href,
  external = false,
  externalLabel = "(opens in a new tab)",
  variant,
  size,
  isFullWidth,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  className,
  children,
  ref,
  ...props
}: LinkButtonProps) {
  const iconSize = getButtonIconSize(size);

  return (
    <a
      ref={ref}
      href={href}
      {...(external && { target: "_blank", rel: "noopener noreferrer" })}
      className={cn(buttonVariants({ variant, size, isFullWidth }), className)}
      {...props}
    >
      {LeftIcon && (
        <LeftIcon aria-hidden="true" size={iconSize} className="shrink-0" />
      )}
      {children}
      {RightIcon && (
        <RightIcon aria-hidden="true" size={iconSize} className="shrink-0" />
      )}
      {external && <span className="sr-only">{` ${externalLabel}`}</span>}
    </a>
  );
}
