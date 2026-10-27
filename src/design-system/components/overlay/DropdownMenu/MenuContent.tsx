"use client";

import {
  useEffect,
  useMemo,
  useRef,
  type ComponentProps,
  type KeyboardEvent,
} from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../../utils/cn";
import { mergeRefs } from "../../../utils/mergeRefs";
import { useDropdownMenu } from "./DropdownMenuContext";

// Class names are written out in full so Tailwind can detect them statically.
const menuContentVariants = cva(
  "absolute top-full z-[var(--z-dropdown)] mt-1 flex min-w-48 flex-col rounded-standard border-2 border-border-strong bg-surface-overlay p-1 text-text-primary shadow-floating outline-none",
  {
    variants: {
      align: {
        start: "left-0",
        end: "right-0",
      },
    },
    defaultVariants: {
      align: "start",
    },
  },
);

const ENABLED_ITEM_SELECTOR =
  '[role="menuitem"]:not([aria-disabled="true"]), [role="menuitemcheckbox"]:not([aria-disabled="true"])';

export interface MenuContentProps
  extends
    Omit<ComponentProps<"div">, "role">,
    VariantProps<typeof menuContentVariants> {}

/** Renders only while the menu is open, and moves focus to its first or last item. */
export function MenuContent({
  align,
  className,
  onKeyDown,
  ref,
  ...props
}: MenuContentProps) {
  const { isOpen, triggerId, contentId, triggerRef, initialFocus, closeMenu } =
    useDropdownMenu();
  const contentRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMemo(() => mergeRefs(contentRef, ref), [ref]);

  useEffect(() => {
    if (!isOpen) return;
    const items = getEnabledItems(contentRef.current);
    const target = initialFocus === "last" ? items.at(-1) : items[0];
    (target ?? contentRef.current)?.focus();
  }, [isOpen, initialFocus]);

  if (!isOpen) return null;

  function getEnabledItems(container: HTMLElement | null) {
    return Array.from(
      container?.querySelectorAll<HTMLElement>(ENABLED_ITEM_SELECTOR) ?? [],
    );
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;

    const items = getEnabledItems(contentRef.current);
    const currentIndex = items.indexOf(document.activeElement as HTMLElement);
    let nextIndex: number | null = null;

    switch (event.key) {
      case "ArrowDown":
        nextIndex = (currentIndex + 1) % items.length;
        break;
      case "ArrowUp":
        nextIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = items.length - 1;
        break;
      case "Tab":
        // Let focus continue from the trigger rather than from a removed item.
        triggerRef.current?.focus();
        closeMenu({ returnFocus: false });
        return;
      default:
        return;
    }

    event.preventDefault();
    items[nextIndex]?.focus();
  }

  return (
    <div
      ref={mergedRef}
      id={contentId}
      role="menu"
      aria-labelledby={triggerId}
      tabIndex={-1}
      className={cn(menuContentVariants({ align }), className)}
      onKeyDown={handleKeyDown}
      {...props}
    />
  );
}
