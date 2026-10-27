"use client";

import { useMemo, type ComponentProps, type MouseEvent } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../../utils/cn";
import { mergeRefs } from "../../../utils/mergeRefs";
import { useSelect } from "./SelectContext";

// Class names are written out in full so Tailwind can detect them statically.
const selectContentVariants = cva(
  "absolute top-full z-[var(--z-dropdown)] mt-1 flex max-h-64 min-w-full flex-col overflow-y-auto rounded-standard border-2 border-border-strong bg-surface-overlay p-1 text-text-primary shadow-floating",
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

export interface SelectContentProps
  extends
    Omit<ComponentProps<"div">, "role">,
    VariantProps<typeof selectContentVariants> {}

/**
 * The listbox. It stays mounted (but hidden) while closed, so items can
 * report their text for the trigger and `aria-controls` always resolves.
 * It renders next to the trigger, not in a portal, so it also stays above
 * its surroundings inside a Dialog.
 */
export function SelectContent({
  align,
  className,
  onMouseDown,
  ref,
  ...props
}: SelectContentProps) {
  const select = useSelect();
  const mergedRef = useMemo(
    () => mergeRefs(select.contentRef, ref),
    [select.contentRef, ref],
  );

  function handleMouseDown(event: MouseEvent<HTMLDivElement>) {
    onMouseDown?.(event);
    // Keep focus on the trigger / input while picking with the pointer.
    event.preventDefault();
  }

  return (
    <div
      ref={mergedRef}
      id={select.listboxId}
      role="listbox"
      hidden={!select.isOpen}
      aria-labelledby={select.labelId ?? select.controlId}
      className={cn(selectContentVariants({ align }), className)}
      onMouseDown={handleMouseDown}
      {...props}
    />
  );
}
