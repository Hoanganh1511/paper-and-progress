"use client";

import { type ComponentProps, type MouseEvent } from "react";
import { type LucideIcon } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../../utils/cn";
import { useDropdownMenu } from "./DropdownMenuContext";

// Class names are written out in full so Tailwind can detect them statically.
// min-h-11 keeps the 44px touch target. Hover moves focus to the item, so the
// focus background doubles as the hover style.
const menuItemVariants = cva(
  [
    "flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-sharp px-3 py-2 text-left font-body text-body-md",
    "transition-colors duration-[var(--duration-fast)]",
    "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-solid focus-visible:outline-border-focus",
    "aria-disabled:cursor-not-allowed aria-disabled:opacity-50",
  ],
  {
    variants: {
      destructive: {
        true: "text-danger-text focus:bg-danger-bg",
        false: "text-text-primary focus:bg-surface-sunken",
      },
    },
    defaultVariants: {
      destructive: false,
    },
  },
);

export interface MenuItemProps
  extends
    Omit<ComponentProps<"button">, "type" | "role" | "onSelect">,
    Omit<VariantProps<typeof menuItemVariants>, "destructive"> {
  icon?: LucideIcon;
  /** Shown on the right, e.g. "⌘K". Display only: it does not bind the key. */
  shortcut?: string;
  destructive?: boolean;
  /** Called when the item is chosen by click, Enter or Space. The menu then closes. */
  onSelect?: () => void;
}

export function MenuItem({
  icon: Icon,
  shortcut,
  disabled = false,
  destructive = false,
  onSelect,
  className,
  children,
  onClick,
  onMouseMove,
  ref,
  ...props
}: MenuItemProps) {
  const { closeMenu } = useDropdownMenu();

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (disabled) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
    if (event.defaultPrevented) return;
    onSelect?.();
    closeMenu();
  }

  function handleMouseMove(event: MouseEvent<HTMLButtonElement>) {
    onMouseMove?.(event);
    if (!disabled && document.activeElement !== event.currentTarget) {
      event.currentTarget.focus();
    }
  }

  return (
    <button
      ref={ref}
      type="button"
      role="menuitem"
      tabIndex={-1}
      aria-disabled={disabled || undefined}
      className={cn(menuItemVariants({ destructive }), className)}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      {...props}
    >
      {Icon && <Icon aria-hidden="true" size={16} className="shrink-0" />}
      <span className="flex-1">{children}</span>
      {shortcut && (
        <kbd className="shrink-0 font-body text-caption text-text-muted">
          {shortcut}
        </kbd>
      )}
    </button>
  );
}
