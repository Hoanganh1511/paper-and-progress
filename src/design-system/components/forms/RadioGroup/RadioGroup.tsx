"use client";

import { useId, useMemo, useState, type ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../../utils/cn";
import { useFieldControlProps } from "../FormField/FormFieldContext";
import { useFormField } from "../FormField/FormFieldContext";
import { RadioGroupContext } from "./RadioGroupContext";

const radioGroupVariants = cva("flex", {
  variants: {
    orientation: {
      vertical: "flex-col gap-1",
      horizontal: "flex-row flex-wrap gap-x-6 gap-y-1",
    },
  },
  defaultVariants: {
    orientation: "vertical",
  },
});

export interface RadioGroupProps
  extends
    Omit<ComponentProps<"div">, "defaultValue" | "onChange">,
    VariantProps<typeof radioGroupVariants> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Shared `name` of the radios, for native form submission. */
  name?: string;
  disabled?: boolean;
}

/**
 * Groups native radio inputs that share a `name`, so the browser provides the
 * radiogroup keyboard model: Tab enters the group on the selected item, and the
 * Arrow keys move and select (wrapping at the ends). Name it with
 * `aria-label`/`aria-labelledby`, or wrap it in a FormField.
 */
export function RadioGroup({
  value,
  defaultValue,
  onValueChange,
  name,
  disabled = false,
  orientation,
  id,
  className,
  children,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  "aria-required": ariaRequired,
  "aria-labelledby": ariaLabelledBy,
  ref,
  ...props
}: RadioGroupProps) {
  const generatedName = useId();
  const field = useFormField();
  const control = useFieldControlProps({
    id,
    describedBy: ariaDescribedBy,
    invalid: ariaInvalid,
    required: ariaRequired,
  });

  const [internalValue, setInternalValue] = useState(defaultValue);
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;
  const groupName = name ?? generatedName;

  const context = useMemo(
    () => ({
      name: groupName,
      value: currentValue,
      isDisabled: disabled,
      onValueChange: (nextValue: string) => {
        if (!isControlled) setInternalValue(nextValue);
        onValueChange?.(nextValue);
      },
    }),
    [groupName, currentValue, disabled, isControlled, onValueChange],
  );

  return (
    <RadioGroupContext value={context}>
      <div
        ref={ref}
        role="radiogroup"
        id={control.id}
        aria-labelledby={ariaLabelledBy ?? field?.labelId}
        aria-describedby={control["aria-describedby"]}
        aria-invalid={control["aria-invalid"]}
        aria-required={control["aria-required"]}
        className={cn(radioGroupVariants({ orientation }), className)}
        {...props}
      >
        {children}
      </div>
    </RadioGroupContext>
  );
}
