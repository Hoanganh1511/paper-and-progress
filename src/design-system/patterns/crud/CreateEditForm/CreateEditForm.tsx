"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type FormEvent,
  type ReactNode,
  type Ref,
} from "react";
import { cn } from "../../../utils/cn";
import { mergeRefs } from "../../../utils/mergeRefs";
import { Stack, Text } from "../../../primitives";
import {
  Alert,
  Button,
  Checkbox,
  FormField,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  Textarea,
} from "../../../components";

export type CreateEditFieldType =
  "text" | "email" | "url" | "number" | "textarea" | "select" | "checkbox";

export type CreateEditValue = string | boolean;
export type CreateEditValues = Record<string, CreateEditValue>;

export interface CreateEditOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface CreateEditField {
  /** Key of the field in the submitted values. */
  name: string;
  label: string;
  /** Defaults to "text". */
  type?: CreateEditFieldType;
  description?: string;
  placeholder?: string;
  required?: boolean;
  /** Choices of a "select" field. */
  options?: CreateEditOption[];
  /** Visible lines of a "textarea" field. */
  rows?: number;
  /** Extra check run after the built-in ones; return a message to reject the value. */
  validate?: (
    value: CreateEditValue,
    values: CreateEditValues,
  ) => string | undefined;
}

export interface CreateEditFormLabels {
  createTitle: string;
  editTitle: string;
  createSubmit: string;
  editSubmit: string;
  cancel: string;
  /** `{label}` is replaced with the field's label. */
  required: string;
  invalidEmail: string;
  invalidUrl: string;
  invalidNumber: string;
  selectPlaceholder: string;
}

export const defaultCreateEditFormLabels: CreateEditFormLabels = {
  createTitle: "Create",
  editTitle: "Edit",
  createSubmit: "Create",
  editSubmit: "Save changes",
  cancel: "Cancel",
  required: "{label} is required.",
  invalidEmail: "Enter a valid email address.",
  invalidUrl: "Enter a valid URL, including https://.",
  invalidNumber: "Enter a valid number.",
  selectPlaceholder: "Select…",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidUrl(value: string) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function readValue(
  formData: FormData,
  field: CreateEditField,
): CreateEditValue {
  if (field.type === "checkbox") return formData.get(field.name) === "on";
  const raw = formData.get(field.name);
  return typeof raw === "string" ? raw.trim() : "";
}

export interface CreateEditFormProps extends Omit<
  ComponentProps<"form">,
  "onSubmit" | "children" | "title" | "ref"
> {
  mode: "create" | "edit";
  fields: CreateEditField[];
  /** Called with `{ [field.name]: value }` once everything validates. Checkboxes give booleans. */
  onSubmit: (values: CreateEditValues) => void;
  onCancel?: () => void;
  /** Initial values; use them to fill the form when editing. */
  defaultValues?: Partial<CreateEditValues>;
  title?: ReactNode;
  description?: ReactNode;
  /** Heading element of the title; pick the level that fits where the form sits. */
  titleAs?: "h1" | "h2" | "h3";
  isSubmitting?: boolean;
  /** A form-level error, e.g. "Could not save, try again". */
  error?: ReactNode;
  /** Field errors reported by the server, by field name. */
  errors?: Record<string, string | undefined>;
  submitLabel?: string;
  /** Replace any of the texts (translations). */
  labels?: Partial<CreateEditFormLabels>;
  ref?: Ref<HTMLFormElement>;
}

/**
 * A form for creating or editing a record, described by a list of fields. It
 * validates (required, email / URL / number shape, your own `validate`),
 * focuses the first invalid field, and gives `onSubmit` plain values.
 * Saving, redirecting and server errors (`error`, `errors`) stay with the
 * caller. Use it on a page or inside a Dialog.
 */
export function CreateEditForm({
  mode,
  fields,
  onSubmit,
  onCancel,
  defaultValues = {},
  title,
  description,
  titleAs = "h2",
  isSubmitting = false,
  error,
  errors: serverErrors,
  submitLabel,
  labels: labelOverrides,
  className,
  ref,
  ...props
}: CreateEditFormProps) {
  const labels = { ...defaultCreateEditFormLabels, ...labelOverrides };
  const titleId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const mergedRef = useMemo(() => mergeRefs(formRef, ref), [ref]);
  const shouldFocusError = useRef(false);
  const [clientErrors, setClientErrors] = useState<
    Record<string, string | undefined>
  >({});
  const errors = { ...serverErrors, ...clientErrors };

  // After a failed submit, move focus to the first control marked invalid.
  useEffect(() => {
    if (!shouldFocusError.current) return;
    shouldFocusError.current = false;
    formRef.current
      ?.querySelector<HTMLElement>('[aria-invalid="true"]')
      ?.focus();
  }, [clientErrors]);

  function clearError(name: string) {
    setClientErrors((current) => ({ ...current, [name]: undefined }));
  }

  function validateField(
    field: CreateEditField,
    value: CreateEditValue,
    values: CreateEditValues,
  ) {
    const isEmpty = value === "" || value === false;
    if (isEmpty) {
      return field.required
        ? labels.required.replace("{label}", field.label)
        : undefined;
    }
    if (typeof value === "string") {
      if (field.type === "email" && !EMAIL_PATTERN.test(value)) {
        return labels.invalidEmail;
      }
      if (field.type === "url" && !isValidUrl(value)) return labels.invalidUrl;
      if (field.type === "number" && Number.isNaN(Number(value))) {
        return labels.invalidNumber;
      }
    }
    return field.validate?.(value, values);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const values: CreateEditValues = {};
    fields.forEach((field) => {
      values[field.name] = readValue(formData, field);
    });

    const nextErrors: Record<string, string | undefined> = {};
    fields.forEach((field) => {
      nextErrors[field.name] = validateField(field, values[field.name], values);
    });

    shouldFocusError.current = true;
    setClientErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    shouldFocusError.current = false;
    onSubmit(values);
  }

  function renderField(field: CreateEditField) {
    const type = field.type ?? "text";
    const error = errors[field.name];
    const defaultValue = defaultValues[field.name];
    const common = {
      name: field.name,
      disabled: isSubmitting,
      onChange: () => clearError(field.name),
    };

    if (type === "checkbox") {
      const errorId = `${titleId}-${field.name}-error`;
      return (
        <Stack gap={1} key={field.name}>
          <Checkbox
            {...common}
            label={field.label}
            defaultChecked={defaultValue === true}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
          />
          {field.description && (
            <Text size="body-sm" color="muted">
              {field.description}
            </Text>
          )}
          {error && (
            <Text
              as="p"
              id={errorId}
              role="alert"
              size="body-sm"
              color="danger"
            >
              {error}
            </Text>
          )}
        </Stack>
      );
    }

    return (
      <FormField
        key={field.name}
        label={field.label}
        description={field.description}
        error={error}
        required={field.required}
      >
        {type === "textarea" ? (
          <Textarea
            {...common}
            rows={field.rows}
            placeholder={field.placeholder}
            defaultValue={typeof defaultValue === "string" ? defaultValue : ""}
          />
        ) : type === "select" ? (
          <Select
            name={field.name}
            disabled={isSubmitting}
            defaultValue={
              typeof defaultValue === "string" && defaultValue
                ? defaultValue
                : undefined
            }
            onValueChange={() => clearError(field.name)}
          >
            <SelectTrigger
              placeholder={field.placeholder ?? labels.selectPlaceholder}
            />
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            {...common}
            type={type === "number" ? "text" : type}
            inputMode={type === "number" ? "decimal" : undefined}
            placeholder={field.placeholder}
            defaultValue={typeof defaultValue === "string" ? defaultValue : ""}
          />
        )}
      </FormField>
    );
  }

  const heading =
    title ?? (mode === "create" ? labels.createTitle : labels.editTitle);

  return (
    <form
      ref={mergedRef}
      noValidate
      aria-labelledby={titleId}
      className={cn(className)}
      onSubmit={handleSubmit}
      {...props}
    >
      <Stack gap={6}>
        <Stack gap={1}>
          <Text as={titleAs} id={titleId} size="heading-md" weight="semibold">
            {heading}
          </Text>
          {description && (
            <Text size="body-md" color="secondary">
              {description}
            </Text>
          )}
        </Stack>
        {error && <Alert variant="danger">{error}</Alert>}
        <Stack gap={4}>{fields.map(renderField)}</Stack>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={onCancel}
            >
              {labels.cancel}
            </Button>
          )}
          <Button type="submit" isLoading={isSubmitting}>
            {submitLabel ??
              (mode === "create" ? labels.createSubmit : labels.editSubmit)}
          </Button>
        </div>
      </Stack>
    </form>
  );
}
