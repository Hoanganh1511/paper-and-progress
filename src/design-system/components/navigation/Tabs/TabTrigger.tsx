"use client";

import { type ComponentProps, type MouseEvent } from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../../utils/cn";
import { focusRingClasses } from "../../../primitives/FocusRing";
import { getPanelId, getTabId, useTabs } from "./TabsContext";

// Class names are written out in full so Tailwind can detect them statically.
// Both variants are 44px tall (h-11) for the touch target; the selected state
// shows as an underline or a filled pill, never by color alone.
const tabTriggerVariants = cva(
  [
    "inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 font-body text-body-md font-medium whitespace-nowrap",
    "transition-colors duration-[var(--duration-fast)] ease-[var(--ease-default)]",
    "disabled:cursor-not-allowed disabled:opacity-50",
    focusRingClasses,
  ],
  {
    variants: {
      variant: {
        underline: [
          "relative px-1 text-text-muted hover:text-text-primary aria-selected:text-text-primary",
          "after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-transparent aria-selected:after:bg-action-primary",
        ],
        pill: "rounded-pill px-4 text-text-secondary hover:bg-surface-card aria-selected:bg-accent-lime aria-selected:font-semibold aria-selected:text-ink",
      },
    },
  },
);

export interface TabTriggerProps extends Omit<
  ComponentProps<"button">,
  "type" | "role" | "value"
> {
  /** Matches the `value` of the TabPanel this tab controls. */
  value: string;
}

export function TabTrigger({
  value,
  className,
  onClick,
  ref,
  ...props
}: TabTriggerProps) {
  const { value: selectedValue, onValueChange, variant, baseId } = useTabs();
  const isSelected = selectedValue === value;
  // Roving tabindex: only the selected tab is a tab stop. With no selection
  // yet, every tab stays reachable.
  const isTabStop = isSelected || selectedValue === undefined;

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    onClick?.(event);
    if (!event.defaultPrevented) onValueChange(value);
  }

  return (
    <button
      ref={ref}
      type="button"
      role="tab"
      id={getTabId(baseId, value)}
      aria-selected={isSelected}
      aria-controls={getPanelId(baseId, value)}
      tabIndex={isTabStop ? 0 : -1}
      className={cn(tabTriggerVariants({ variant }), className)}
      onClick={handleClick}
      {...props}
    />
  );
}
