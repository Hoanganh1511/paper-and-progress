"use client";

import { type ChangeEvent, type ComponentProps, type ReactNode } from "react";
import { cn } from "../../../utils/cn";
import { useRadioGroup } from "./RadioGroupContext";

export interface RadioItemProps extends Omit<
  ComponentProps<"input">,
  "type" | "name" | "value" | "checked" | "defaultChecked"
> {
  value: string;
  label?: ReactNode;
}

/**
 * One option of a RadioGroup. `className` styles the outer <label>; `ref` goes
 * to the <input>. Without a visible `label`, pass `aria-label`.
 */
export function RadioItem({
  value,
  label,
  disabled,
  className,
  onChange,
  ref,
  ...props
}: RadioItemProps) {
  const group = useRadioGroup();

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange?.(event);
    group.onValueChange(value);
  }

  return (
    <label
      className={cn(
        "inline-flex min-h-11 min-w-11 cursor-pointer items-center gap-3 font-body text-body-md text-text-primary",
        "has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50",
        className,
      )}
    >
      <span className="relative inline-flex size-5 shrink-0">
        <input
          ref={ref}
          type="radio"
          name={group.name}
          value={value}
          checked={group.value === value}
          disabled={disabled ?? group.isDisabled}
          onChange={handleChange}
          className="peer absolute inset-0 m-0 size-full cursor-[inherit] opacity-0"
          {...props}
        />
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none size-full rounded-pill border-2 border-border-strong bg-surface-card transition-colors duration-[var(--duration-fast)]",
            "peer-checked:border-action-primary peer-checked:bg-action-primary",
            "peer-focus-visible:outline-2 peer-focus-visible:outline-solid peer-focus-visible:outline-border-focus peer-focus-visible:outline-offset-2",
          )}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 m-auto size-2 scale-0 rounded-pill bg-text-inverse transition-transform duration-[var(--duration-fast)] peer-checked:scale-100"
        />
      </span>
      {label && <span>{label}</span>}
    </label>
  );
}
