"use client";

import { createContext, useContext, type AriaAttributes } from "react";

export interface FormFieldContextValue {
  id: string;
  labelId: string;
  errorId: string;
  descriptionId: string;
  hasError: boolean;
  hasDescription: boolean;
  isRequired: boolean;
}

export const FormFieldContext = createContext<FormFieldContextValue | null>(
  null,
);

/** Returns the surrounding FormField state, or null outside of a FormField. */
export function useFormField() {
  return useContext(FormFieldContext);
}

interface FieldControlOptions {
  id?: string;
  describedBy?: string;
  invalid?: AriaAttributes["aria-invalid"];
  required?: AriaAttributes["aria-required"];
}

/**
 * Accessibility props for a form control. Values passed to the control win;
 * otherwise they come from the surrounding FormField.
 */
export function useFieldControlProps({
  id,
  describedBy,
  invalid,
  required,
}: FieldControlOptions) {
  const field = useFormField();

  const describedByIds =
    [
      describedBy,
      field?.hasDescription ? field.descriptionId : undefined,
      field?.hasError ? field.errorId : undefined,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

  const ariaInvalid = invalid ?? (field?.hasError ? true : undefined);
  const hasError =
    ariaInvalid === true ||
    ariaInvalid === "true" ||
    ariaInvalid === "grammar" ||
    ariaInvalid === "spelling";

  return {
    id: id ?? field?.id,
    "aria-describedby": describedByIds,
    "aria-invalid": ariaInvalid,
    "aria-required": required ?? (field?.isRequired ? true : undefined),
    hasError,
  };
}
