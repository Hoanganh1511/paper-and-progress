"use client";

import { type ComponentProps, type MouseEvent } from "react";
import { LoaderCircle, type LucideIcon } from "lucide-react";
import { cn } from "../../../utils/cn";
import {
  buttonVariants,
  getButtonIconSize,
  type ButtonVariantProps,
} from "./buttonVariants";

export interface ButtonProps
  extends ComponentProps<"button">, ButtonVariantProps {
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
  isLoading?: boolean;
}

export function Button({
  variant,
  size,
  isFullWidth,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  isLoading = false,
  type = "button",
  className,
  children,
  onClick,
  ref,
  ...props
}: ButtonProps) {
  const iconSize = getButtonIconSize(size);

  // Stay focusable while loading (unlike `disabled`), but ignore activation.
  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (isLoading) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  }

  return (
    <button
      ref={ref}
      type={type}
      aria-busy={isLoading || undefined}
      aria-disabled={isLoading || undefined}
      className={cn(buttonVariants({ variant, size, isFullWidth }), className)}
      onClick={handleClick}
      {...props}
    >
      {isLoading ? (
        <LoaderCircle
          aria-hidden="true"
          size={iconSize}
          className="shrink-0 animate-spin motion-reduce:animate-none"
        />
      ) : (
        LeftIcon && (
          <LeftIcon aria-hidden="true" size={iconSize} className="shrink-0" />
        )
      )}
      {children}
      {RightIcon && (
        <RightIcon aria-hidden="true" size={iconSize} className="shrink-0" />
      )}
    </button>
  );
}
