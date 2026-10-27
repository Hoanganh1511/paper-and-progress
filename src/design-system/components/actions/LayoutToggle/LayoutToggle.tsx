"use client";

import { type ComponentProps } from "react";
import { LayoutGrid, List, type LucideIcon } from "lucide-react";
import { cn } from "../../../utils/cn";
import { IconButton } from "../Button/IconButton";

export interface LayoutOption {
  value: string;
  /** Accessible name of the option's button. */
  label: string;
  icon: LucideIcon;
}

export const defaultLayoutOptions: LayoutOption[] = [
  { value: "grid", label: "Grid view", icon: LayoutGrid },
  { value: "list", label: "List view", icon: List },
];

export interface LayoutToggleProps extends Omit<
  ComponentProps<"div">,
  "onChange" | "role"
> {
  value: string;
  onValueChange: (value: string) => void;
  /** Layouts to choose from; grid and list by default. */
  options?: LayoutOption[];
  /** Accessible name of the whole group. */
  label?: string;
}

/**
 * A group of icon buttons that switches how a collection is laid out (grid,
 * list, ...). The chosen layout is the pressed button (`aria-pressed`), shown
 * with the lime fill and the pressed shadow, so it is not colour alone.
 */
export function LayoutToggle({
  value,
  onValueChange,
  options = defaultLayoutOptions,
  label = "Layout",
  className,
  ref,
  ...props
}: LayoutToggleProps) {
  return (
    <div
      ref={ref}
      role="group"
      aria-label={label}
      className={cn("inline-flex items-center gap-2", className)}
      {...props}
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <IconButton
            key={option.value}
            icon={option.icon}
            aria-label={option.label}
            aria-pressed={isSelected}
            variant={isSelected ? "accent" : "outline"}
            className={cn(
              "size-11",
              isSelected && "translate-x-0.5 translate-y-0.5 shadow-none",
            )}
            onClick={() => onValueChange(option.value)}
          />
        );
      })}
    </div>
  );
}
