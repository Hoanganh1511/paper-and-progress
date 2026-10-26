"use client";

import { type ComponentProps, type MouseEvent, type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../../utils/cn";
import { focusRingWithinClasses } from "../../../primitives/FocusRing";
import { useFieldControlProps } from "../FormField/FormFieldContext";

// Class names are written out in full so Tailwind can detect them statically.
// compact/default are shorter than 44px, so a ::before pseudo-element (kept
// behind the content by `isolate` + `-z-10`) extends the clickable area; the
// wrapper's click handler forwards those clicks to the input.
const inputWrapperVariants = cva(
  [
    "relative isolate flex w-full items-center gap-2 rounded-standard border bg-surface-card font-body text-text-primary",
    "transition-colors duration-[var(--duration-fast)] ease-[var(--ease-default)]",
    "has-[:disabled]:cursor-not-allowed has-[:disabled]:bg-surface-sunken has-[:disabled]:opacity-50",
    focusRingWithinClasses,
  ],
  {
    variants: {
      size: {
        compact:
          "h-[var(--height-compact)] px-2 text-body-sm before:absolute before:top-1/2 before:left-0 before:-z-10 before:h-11 before:w-full before:-translate-y-1/2",
        default:
          "h-[var(--height-default)] px-3 text-body-md before:absolute before:top-1/2 before:left-0 before:-z-10 before:h-11 before:w-full before:-translate-y-1/2",
        comfortable: "h-[var(--height-comfortable)] px-4 text-body-lg",
      },
      hasError: {
        true: "border-danger-text",
        false: "border-border-default focus-within:border-border-strong",
      },
    },
    defaultVariants: {
      size: "default",
      hasError: false,
    },
  },
);

export interface InputProps
  extends
    Omit<ComponentProps<"input">, "size">,
    Pick<VariantProps<typeof inputWrapperVariants>, "size"> {
  leftAddon?: ReactNode;
  rightAddon?: ReactNode;
}

/**
 * `className` styles the visual box (the wrapper); `ref` and all other props
 * go to the underlying <input>.
 */
export function Input({
  size,
  leftAddon,
  rightAddon,
  className,
  id,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  "aria-required": ariaRequired,
  ref,
  ...props
}: InputProps) {
  const control = useFieldControlProps({
    id,
    describedBy: ariaDescribedBy,
    invalid: ariaInvalid,
    required: ariaRequired,
  });

  function handleWrapperClick(event: MouseEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("button, a, input")) return;
    event.currentTarget.querySelector("input")?.focus();
  }

  return (
    <div
      className={cn(
        inputWrapperVariants({ size, hasError: control.hasError }),
        className,
      )}
      onClick={handleWrapperClick}
    >
      {leftAddon && (
        <span className="inline-flex shrink-0 items-center text-text-muted">
          {leftAddon}
        </span>
      )}
      <input
        ref={ref}
        id={control.id}
        aria-describedby={control["aria-describedby"]}
        aria-invalid={control["aria-invalid"]}
        aria-required={control["aria-required"]}
        className="h-full min-w-0 flex-1 bg-transparent text-inherit placeholder:text-text-muted focus:outline-none disabled:cursor-not-allowed [&::-webkit-search-cancel-button]:appearance-none"
        {...props}
      />
      {rightAddon && (
        <span className="inline-flex shrink-0 items-center text-text-muted">
          {rightAddon}
        </span>
      )}
    </div>
  );
}
