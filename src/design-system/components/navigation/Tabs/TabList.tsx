"use client";

import { type ComponentProps, type KeyboardEvent } from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../../utils/cn";
import { useTabs } from "./TabsContext";

// Class names are written out in full so Tailwind can detect them statically.
const tabListVariants = cva("flex", {
  variants: {
    variant: {
      underline: "gap-4 border-b border-border-default",
      pill: "w-fit max-w-full gap-1 overflow-x-auto rounded-pill bg-surface-sunken p-1",
    },
  },
});

const ENABLED_TAB_SELECTOR = '[role="tab"]:not([disabled])';

export type TabListProps = Omit<ComponentProps<"div">, "role">;

/** Name the list with `aria-label` or `aria-labelledby`. */
export function TabList({ className, onKeyDown, ref, ...props }: TabListProps) {
  const { variant } = useTabs();

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;

    const tabs = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(ENABLED_TAB_SELECTOR),
    );
    const currentIndex = tabs.indexOf(document.activeElement as HTMLElement);
    if (currentIndex === -1) return;

    let nextIndex: number;
    switch (event.key) {
      case "ArrowRight":
        nextIndex = (currentIndex + 1) % tabs.length;
        break;
      case "ArrowLeft":
        nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = tabs.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    // Selection follows focus; clicking runs the trigger's normal select path.
    tabs[nextIndex].focus();
    tabs[nextIndex].click();
  }

  return (
    <div
      ref={ref}
      role="tablist"
      aria-orientation="horizontal"
      className={cn(tabListVariants({ variant }), className)}
      onKeyDown={handleKeyDown}
      {...props}
    />
  );
}
