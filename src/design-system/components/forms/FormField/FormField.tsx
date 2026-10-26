"use client";

import { useId, useMemo, type ComponentProps, type ReactNode } from "react";
import { CircleAlert } from "lucide-react";
import { cn } from "../../../utils/cn";
import { FormFieldContext } from "./FormFieldContext";

export interface FormFieldProps extends Omit<
  ComponentProps<"div">,
  "children"
> {
  label: ReactNode;
  required?: boolean;
  description?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
}

export function FormField({
  label,
  required = false,
  description,
  error,
  className,
  children,
  ref,
  ...props
}: FormFieldProps) {
  const id = useId();
  const labelId = `${id}-label`;
  const errorId = `${id}-error`;
  const descriptionId = `${id}-description`;
  const hasError = Boolean(error);
  const hasDescription = Boolean(description);

  const context = useMemo(
    () => ({
      id,
      labelId,
      errorId,
      descriptionId,
      hasError,
      hasDescription,
      isRequired: required,
    }),
    [id, labelId, errorId, descriptionId, hasError, hasDescription, required],
  );

  return (
    <FormFieldContext value={context}>
      <div
        ref={ref}
        className={cn("flex flex-col gap-2", className)}
        {...props}
      >
        <div className="flex flex-col gap-1">
          <label
            id={labelId}
            htmlFor={id}
            className="font-body text-body-sm font-medium text-text-primary"
          >
            {label}
            {required && (
              <span aria-hidden="true" className="text-danger-text">
                {" *"}
              </span>
            )}
          </label>
          {hasDescription && (
            <p
              id={descriptionId}
              className="font-body text-body-sm text-text-muted"
            >
              {description}
            </p>
          )}
        </div>
        {children}
        {hasError && (
          <p
            id={errorId}
            role="alert"
            className="flex items-start gap-1 font-body text-body-sm text-danger-text"
          >
            <CircleAlert
              aria-hidden="true"
              size={16}
              className="mt-0.5 shrink-0"
            />
            <span>{error}</span>
          </p>
        )}
      </div>
    </FormFieldContext>
  );
}
