import { useId, type ChangeEvent, type ReactNode } from "react";
import { CircleAlert, ChevronDown } from "lucide-react";
import { cn } from "@/design-system";

export interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  children: ReactNode;
}

/**
 * A labelled native <select>. Native, not the design system's listbox, because
 * it sits in a scrolling dialog (a floating list would be clipped) and gives
 * phones their own picker. Label and error are linked like FormField's.
 */
export function SelectField({
  label,
  value,
  onChange,
  required = false,
  error,
  children,
}: SelectFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className="flex flex-col gap-2">
      <label
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
      <div className="relative">
        <select
          id={id}
          value={value}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={(event: ChangeEvent<HTMLSelectElement>) =>
            onChange(event.target.value)
          }
          className={cn(
            "h-[var(--height-default)] w-full cursor-pointer appearance-none rounded-standard border-2 bg-surface-card py-0 pr-9 pl-3 font-body text-body-md text-text-primary",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-border-focus",
            error ? "border-danger-text" : "border-border-strong",
          )}
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden="true"
          size={16}
          className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-text-muted"
        />
      </div>
      {error && (
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
  );
}
