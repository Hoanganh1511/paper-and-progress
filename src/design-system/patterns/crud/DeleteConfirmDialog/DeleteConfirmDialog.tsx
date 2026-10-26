"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import { Alert, AlertDialog, FormField, Input } from "../../../components";

export interface DeleteConfirmDialogLabels {
  /** Title for one item whose name is not known. */
  titleOne: string;
  /** `{name}` is replaced with `itemName`. */
  titleNamed: string;
  /** `{count}` is replaced with `count`. */
  titleMany: string;
  description: string;
  confirm: string;
  cancel: string;
  /** `{text}` is replaced with `confirmationText`. */
  confirmationPrompt: string;
}

export const defaultDeleteConfirmDialogLabels: DeleteConfirmDialogLabels = {
  titleOne: "Delete this item?",
  titleNamed: "Delete “{name}”?",
  titleMany: "Delete {count} items?",
  description: "This action cannot be undone.",
  confirm: "Delete",
  cancel: "Cancel",
  confirmationPrompt: "Type {text} to confirm",
};

export interface DeleteConfirmDialogProps extends Omit<
  ComponentProps<typeof AlertDialog>,
  | "title"
  | "description"
  | "variant"
  | "confirmLabel"
  | "cancelLabel"
  | "isLoading"
  | "isConfirmDisabled"
  | "children"
  | "onConfirm"
  | "onCancel"
> {
  onConfirm: () => void;
  onCancel: () => void;
  /** Name of the item being deleted, shown in the title. */
  itemName?: string;
  /** Number of items for a bulk delete; more than 1 switches to the plural title. */
  count?: number;
  /** Replaces the default description. */
  description?: ReactNode;
  /** Shows the delete button as busy while the deletion runs. */
  isDeleting?: boolean;
  /** An error from the last attempt, shown inside the dialog. */
  error?: ReactNode;
  /** When set, the user must type this exact text before Delete is enabled. */
  confirmationText?: string;
  /** Replace any of the texts (translations). */
  labels?: Partial<DeleteConfirmDialogLabels>;
}

/**
 * A "are you sure?" step before deleting, built on AlertDialog (role
 * alertdialog; Escape and backdrop clicks do not dismiss it). For
 * destructive deletes, `confirmationText` makes the user type a phrase first.
 * The caller deletes in `onConfirm` and closes it by setting `open` to false.
 */
export function DeleteConfirmDialog({
  open,
  ...props
}: DeleteConfirmDialogProps) {
  // Mounting only while open resets the typed phrase for every new prompt.
  if (!open) return null;
  return <OpenDeleteConfirmDialog open {...props} />;
}

function OpenDeleteConfirmDialog({
  itemName,
  count = 1,
  description,
  isDeleting = false,
  error,
  confirmationText,
  labels: labelOverrides,
  onConfirm,
  onCancel,
  ...props
}: DeleteConfirmDialogProps) {
  const labels = { ...defaultDeleteConfirmDialogLabels, ...labelOverrides };
  const [typedText, setTypedText] = useState("");
  const needsConfirmation = Boolean(confirmationText);
  const isConfirmed =
    !needsConfirmation || typedText.trim() === confirmationText;

  const title =
    count > 1
      ? labels.titleMany.replace("{count}", String(count))
      : itemName
        ? labels.titleNamed.replace("{name}", itemName)
        : labels.titleOne;

  return (
    <AlertDialog
      {...props}
      title={title}
      description={description ?? labels.description}
      variant="destructive"
      confirmLabel={labels.confirm}
      cancelLabel={labels.cancel}
      isLoading={isDeleting}
      isConfirmDisabled={!isConfirmed}
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      {(error || needsConfirmation) && (
        <div className="flex flex-col gap-4">
          {error && <Alert variant="danger">{error}</Alert>}
          {needsConfirmation && (
            <FormField
              label={labels.confirmationPrompt.replace(
                "{text}",
                confirmationText ?? "",
              )}
            >
              <Input
                value={typedText}
                autoComplete="off"
                disabled={isDeleting}
                onChange={(event) => setTypedText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && isConfirmed && !isDeleting) {
                    event.preventDefault();
                    onConfirm();
                  }
                }}
              />
            </FormField>
          )}
        </div>
      )}
    </AlertDialog>
  );
}
