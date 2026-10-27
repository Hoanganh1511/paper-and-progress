"use client";

import {
  useEffect,
  useMemo,
  useRef,
  type ChangeEvent,
  type ComponentProps,
  type ReactNode,
} from "react";
import { Check, Minus } from "lucide-react";
import { cn } from "../../../utils/cn";
import { mergeRefs } from "../../../utils/mergeRefs";

export interface CheckboxProps extends Omit<ComponentProps<"input">, "type"> {
  label?: ReactNode;
  indeterminate?: boolean;
}

/**
 * A native checkbox (kept for keyboard, forms and assistive tech) with a custom
 * visual box. `className` styles the outer <label>; `ref` goes to the <input>.
 * Without a visible `label`, pass `aria-label`.
 */
export function Checkbox({
  label,
  indeterminate = false,
  className,
  onChange,
  ref,
  ...props
}: CheckboxProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const mergedRef = useMemo(() => mergeRefs(inputRef, ref), [ref]);

  // `indeterminate` only exists as a DOM property, and a click resets it, so
  // re-apply it after every render.
  useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = indeterminate;
  });

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange?.(event);
    // A click clears the DOM property; restore it while the prop is still true.
    event.target.indeterminate = indeterminate;
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
          ref={mergedRef}
          type="checkbox"
          onChange={handleChange}
          className="peer absolute inset-0 m-0 size-full cursor-[inherit] opacity-0"
          {...props}
        />
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none size-full rounded-sharp border-2 bg-surface-card transition-colors duration-[var(--duration-fast)]",
            "border-border-strong peer-aria-invalid:border-danger-text",
            "peer-focus-visible:outline-2 peer-focus-visible:outline-solid peer-focus-visible:outline-border-focus peer-focus-visible:outline-offset-2",
            indeterminate
              ? "border-action-primary bg-action-primary"
              : "peer-checked:border-action-primary peer-checked:bg-action-primary",
          )}
        />
        {indeterminate ? (
          <Minus
            aria-hidden="true"
            size={14}
            strokeWidth={3}
            className="pointer-events-none absolute inset-0 m-auto text-text-inverse"
          />
        ) : (
          <Check
            aria-hidden="true"
            size={14}
            strokeWidth={3}
            className="pointer-events-none absolute inset-0 m-auto text-text-inverse opacity-0 peer-checked:opacity-100"
          />
        )}
      </span>
      {label && <span>{label}</span>}
    </label>
  );
}
