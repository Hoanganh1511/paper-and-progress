"use client";

import { type ReactNode } from "react";
import { Button } from "../../actions/Button/Button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  type DialogProps,
} from "../Dialog";

export interface AlertDialogProps extends Omit<
  DialogProps,
  "onClose" | "role" | "isDismissible" | "title" | "children"
> {
  title: ReactNode;
  description?: ReactNode;
  variant?: "default" | "destructive";
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** Shows a busy state on the confirm button while the action runs. */
  isLoading?: boolean;
  /** Keeps Confirm unavailable, e.g. until the user typed a confirmation phrase. */
  isConfirmDisabled?: boolean;
  /** Extra content between the description and the buttons. */
  children?: ReactNode;
}

/**
 * A must-answer prompt (role="alertdialog"). Escape and backdrop clicks do
 * nothing and there is no close button: the user has to pick Cancel or
 * Confirm. Cancel receives the initial focus as the safe default. The parent
 * owns `open` and closes the dialog from `onCancel` / `onConfirm`.
 */
export function AlertDialog({
  title,
  description,
  variant = "default",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  isLoading = false,
  isConfirmDisabled = false,
  children,
  size = "sm",
  ...props
}: AlertDialogProps) {
  return (
    <Dialog
      {...props}
      size={size}
      role="alertdialog"
      isDismissible={false}
      onClose={onCancel}
    >
      <DialogHeader
        title={title}
        description={description}
        showCloseButton={false}
      />
      {children && <DialogContent>{children}</DialogContent>}
      <DialogFooter>
        <Button variant="outline" data-autofocus onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button
          variant={variant === "destructive" ? "destructive" : "primary"}
          isLoading={isLoading}
          disabled={isConfirmDisabled}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
