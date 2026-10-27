"use client";

import {
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type MouseEvent,
} from "react";
import { createPortal } from "react-dom";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../../utils/cn";
import { mergeRefs } from "../../../utils/mergeRefs";
import { useEscapeKey } from "../../../hooks/useEscapeKey";
import { useFocusTrap } from "../../../hooks/useFocusTrap";
import { useIsClient } from "../../../hooks/useIsClient";
import { useOverlayLayer } from "../../../hooks/useOverlayLayer";
import { useScrollLock } from "../../../hooks/useScrollLock";
import { DialogContext } from "./DialogContext";

// Class names are written out in full so Tailwind can detect them statically.
// Below `sm` the panel is a bottom sheet (full width, rounded top corners,
// anchored to the bottom edge); from `sm` up it is centered.
const dialogPanelVariants = cva(
  [
    "relative flex max-h-[90dvh] w-full flex-col overflow-hidden border-2 border-border-strong bg-surface-overlay text-text-primary shadow-modal outline-none",
    "rounded-t-soft sm:max-h-[85dvh] sm:rounded-soft",
    "transition-[opacity,translate] duration-[var(--duration-normal)] ease-[var(--ease-default)] starting:translate-y-4 starting:opacity-0 motion-reduce:transition-none",
  ],
  {
    variants: {
      size: {
        sm: "sm:max-w-sm",
        md: "sm:max-w-lg",
        lg: "sm:max-w-2xl",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

export interface DialogProps
  extends
    Omit<ComponentProps<"div">, "role">,
    VariantProps<typeof dialogPanelVariants> {
  open: boolean;
  onClose: () => void;
  /** When false, Escape, the backdrop and the header close button do nothing. */
  isDismissible?: boolean;
  /** Use "alertdialog" (see AlertDialog) for urgent, must-answer prompts. */
  role?: "dialog" | "alertdialog";
}

/**
 * Modal dialog rendered in a portal: traps focus, closes on Escape and on
 * backdrop click (when dismissible), locks page scroll, and restores focus
 * on close. It is a bottom sheet on small screens.
 *
 * Name it with a DialogHeader `title`, or pass `aria-label` / `aria-labelledby`.
 * `className` and `ref` apply to the dialog panel.
 */
export function Dialog({
  open,
  onClose,
  isDismissible = true,
  role = "dialog",
  size,
  className,
  children,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
  ref,
  ...props
}: DialogProps) {
  const isClient = useIsClient();
  const titleId = useId();
  const descriptionId = useId();
  const [hasDescription, setHasDescription] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMemo(() => mergeRefs(panelRef, ref), [ref]);

  const isTopmost = useOverlayLayer(open);
  useFocusTrap(panelRef, open, isTopmost);
  useEscapeKey(open && isDismissible, onClose, isTopmost);
  useScrollLock(open);

  const context = useMemo(
    () => ({
      titleId,
      descriptionId,
      onClose,
      isDismissible,
      setHasDescription,
    }),
    [titleId, descriptionId, onClose, isDismissible],
  );

  if (!open || !isClient) return null;

  function handleBackdropClick(event: MouseEvent<HTMLDivElement>) {
    if (isDismissible && event.target === event.currentTarget) onClose();
  }

  return createPortal(
    <div className="fixed inset-0 z-[var(--z-modal)] flex items-end justify-center sm:items-center sm:p-6">
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-overlay-backdrop"
        onClick={handleBackdropClick}
      />
      <DialogContext value={context}>
        <div
          ref={mergedRef}
          role={role}
          aria-modal="true"
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy ?? (ariaLabel ? undefined : titleId)}
          aria-describedby={
            ariaDescribedBy ?? (hasDescription ? descriptionId : undefined)
          }
          tabIndex={-1}
          className={cn(dialogPanelVariants({ size }), className)}
          {...props}
        >
          {children}
        </div>
      </DialogContext>
    </div>,
    document.body,
  );
}
