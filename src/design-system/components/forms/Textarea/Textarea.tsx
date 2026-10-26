"use client";

import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  type ComponentProps,
  type InputEvent,
} from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../../utils/cn";
import { mergeRefs } from "../../../utils/mergeRefs";
import { focusRingClasses } from "../../../primitives/FocusRing";
import { useFieldControlProps } from "../FormField/FormFieldContext";

// Class names are written out in full so Tailwind can detect them statically.
const textareaVariants = cva(
  [
    "block w-full rounded-standard border bg-surface-card font-body text-text-primary placeholder:text-text-muted",
    "transition-colors duration-[var(--duration-fast)] ease-[var(--ease-default)]",
    "disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:opacity-50",
    focusRingClasses,
  ],
  {
    variants: {
      size: {
        compact: "px-2 py-1 text-body-sm",
        default: "px-3 py-2 text-body-md",
        comfortable: "px-4 py-3 text-body-lg",
      },
      hasError: {
        true: "border-danger-text",
        false: "border-border-default focus-visible:border-border-strong",
      },
      autoResize: {
        true: "resize-none overflow-hidden",
        false: "resize-y",
      },
    },
    defaultVariants: {
      size: "default",
      hasError: false,
      autoResize: false,
    },
  },
);

export interface TextareaProps
  extends
    ComponentProps<"textarea">,
    Pick<VariantProps<typeof textareaVariants>, "size"> {
  /** Grow with the content instead of scrolling. */
  autoResize?: boolean;
}

export function Textarea({
  size,
  autoResize = false,
  rows = 3,
  className,
  id,
  value,
  onInput,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  "aria-required": ariaRequired,
  ref,
  ...props
}: TextareaProps) {
  const control = useFieldControlProps({
    id,
    describedBy: ariaDescribedBy,
    invalid: ariaInvalid,
    required: ariaRequired,
  });

  const innerRef = useRef<HTMLTextAreaElement>(null);
  const mergedRef = useMemo(() => mergeRefs(innerRef, ref), [ref]);

  const resize = useCallback(() => {
    const element = innerRef.current;
    if (!autoResize || !element) return;
    element.style.height = "auto";
    // scrollHeight excludes the border, offset/clientHeight difference adds it back.
    element.style.height = `${
      element.scrollHeight + element.offsetHeight - element.clientHeight
    }px`;
  }, [autoResize]);

  // Also covers the initial render and controlled value changes.
  useLayoutEffect(resize, [resize, value]);

  function handleInput(event: InputEvent<HTMLTextAreaElement>) {
    resize();
    onInput?.(event);
  }

  return (
    <textarea
      ref={mergedRef}
      id={control.id}
      rows={rows}
      value={value}
      aria-describedby={control["aria-describedby"]}
      aria-invalid={control["aria-invalid"]}
      aria-required={control["aria-required"]}
      className={cn(
        textareaVariants({ size, hasError: control.hasError, autoResize }),
        className,
      )}
      onInput={handleInput}
      {...props}
    />
  );
}
