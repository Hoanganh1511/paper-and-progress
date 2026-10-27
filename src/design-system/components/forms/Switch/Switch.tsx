"use client";

import { type ComponentProps, type ReactNode } from "react";
import { cn } from "../../../utils/cn";

export interface SwitchProps extends Omit<
  ComponentProps<"input">,
  "type" | "role" | "size"
> {
  label?: ReactNode;
}

/**
 * A native checkbox with role="switch" (Space toggles it) and a custom track.
 * `className` styles the outer <label>; `ref` goes to the <input>.
 * Without a visible `label`, pass `aria-label`.
 */
export function Switch({ label, className, ref, ...props }: SwitchProps) {
  return (
    <label
      className={cn(
        "inline-flex min-h-11 min-w-11 cursor-pointer items-center gap-3 font-body text-body-md text-text-primary",
        "has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50",
        className,
      )}
    >
      <span className="relative inline-flex h-6 w-11 shrink-0">
        <input
          ref={ref}
          type="checkbox"
          role="switch"
          className="peer absolute inset-0 m-0 size-full cursor-[inherit] opacity-0"
          {...props}
        />
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0 rounded-pill bg-text-muted transition-colors duration-[var(--duration-fast)]",
            "after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-pill after:border after:border-border-strong after:bg-surface after:transition-transform after:duration-[var(--duration-fast)]",
            "peer-checked:bg-action-primary peer-checked:after:translate-x-5",
            "peer-focus-visible:outline-2 peer-focus-visible:outline-solid peer-focus-visible:outline-border-focus peer-focus-visible:outline-offset-2",
          )}
        />
      </span>
      {label && <span>{label}</span>}
    </label>
  );
}
