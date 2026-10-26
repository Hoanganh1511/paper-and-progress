"use client";

import { type ComponentProps } from "react";
import { cn } from "../../../utils/cn";
import { focusRingClasses } from "../../../primitives/FocusRing";
import { getPanelId, getTabId, useTabs } from "./TabsContext";

export interface TabPanelProps extends Omit<
  ComponentProps<"div">,
  "role" | "id"
> {
  /** Matches the `value` of the TabTrigger that controls this panel. */
  value: string;
}

/**
 * Every panel stays in the DOM (so `aria-controls` always resolves) and is
 * hidden unless selected; its content keeps its state while hidden.
 */
export function TabPanel({ value, className, ref, ...props }: TabPanelProps) {
  const { value: selectedValue, baseId } = useTabs();

  return (
    <div
      ref={ref}
      role="tabpanel"
      id={getPanelId(baseId, value)}
      aria-labelledby={getTabId(baseId, value)}
      hidden={selectedValue !== value}
      tabIndex={0}
      className={cn("outline-none", focusRingClasses, className)}
      {...props}
    />
  );
}
