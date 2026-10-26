"use client";

import { useId, useMemo, useState, type ComponentProps } from "react";
import { cn } from "../../../utils/cn";
import { TabsContext, type TabsVariant } from "./TabsContext";

export interface TabsProps extends Omit<ComponentProps<"div">, "defaultValue"> {
  /** Controlled selected tab. Pair it with `onValueChange`. */
  value?: string;
  /** Initially selected tab when uncontrolled. */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  variant?: TabsVariant;
}

/**
 * Owns the selected tab and shares it with TabList, TabTrigger and TabPanel.
 * Give each TabTrigger and its TabPanel the same `value`. Tabs are activated
 * as soon as they receive focus from the arrow keys.
 */
export function Tabs({
  value,
  defaultValue,
  onValueChange,
  variant = "underline",
  className,
  ref,
  ...props
}: TabsProps) {
  const baseId = useId();
  const [internalValue, setInternalValue] = useState(defaultValue);
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;

  const context = useMemo(
    () => ({
      value: currentValue,
      onValueChange: (nextValue: string) => {
        if (!isControlled) setInternalValue(nextValue);
        onValueChange?.(nextValue);
      },
      variant,
      baseId,
    }),
    [currentValue, isControlled, onValueChange, variant, baseId],
  );

  return (
    <TabsContext value={context}>
      <div
        ref={ref}
        className={cn("flex flex-col gap-4", className)}
        {...props}
      />
    </TabsContext>
  );
}
