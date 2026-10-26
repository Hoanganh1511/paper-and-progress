"use client";

import {
  useId,
  useMemo,
  useRef,
  type ComponentProps,
  type MouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../../utils/cn";
import { mergeRefs } from "../../../utils/mergeRefs";
import { useEscapeKey } from "../../../hooks/useEscapeKey";
import { useFocusTrap } from "../../../hooks/useFocusTrap";
import { useIsClient } from "../../../hooks/useIsClient";
import { useOverlayLayer } from "../../../hooks/useOverlayLayer";
import { useScrollLock } from "../../../hooks/useScrollLock";
import { Text } from "../../../primitives/Text";
import { IconButton } from "../../actions/Button/IconButton";

// Class names are written out in full so Tailwind can detect them statically.
// The panel is full width on mobile and a fixed-width column from `sm`.
const drawerPanelVariants = cva(
  [
    "fixed inset-y-0 flex w-full flex-col overflow-hidden bg-surface-overlay text-text-primary shadow-modal outline-none sm:w-80",
    "transition-[opacity,translate] duration-[var(--duration-normal)] ease-[var(--ease-default)] starting:opacity-0 motion-reduce:transition-none",
  ],
  {
    variants: {
      side: {
        left: "left-0 border-r border-border-default starting:-translate-x-4",
        right: "right-0 border-l border-border-default starting:translate-x-4",
      },
    },
    defaultVariants: {
      side: "left",
    },
  },
);

export interface DrawerProps
  extends
    Omit<ComponentProps<"div">, "title" | "role">,
    VariantProps<typeof drawerPanelVariants> {
  open: boolean;
  onClose: () => void;
  /** Heading of the drawer; also its accessible name. */
  title: ReactNode;
  closeLabel?: string;
}

/**
 * A panel that slides in from the side of the screen. It is a modal dialog:
 * focus stays inside, Escape and a click on the backdrop close it, and the
 * page behind does not scroll. `className` and `ref` apply to the panel.
 */
export function Drawer({
  open,
  onClose,
  title,
  closeLabel = "Close",
  side,
  className,
  children,
  ref,
  ...props
}: DrawerProps) {
  const isClient = useIsClient();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMemo(() => mergeRefs(panelRef, ref), [ref]);

  const isTopmost = useOverlayLayer(open);
  useFocusTrap(panelRef, open, isTopmost);
  useEscapeKey(open, onClose, isTopmost);
  useScrollLock(open);

  if (!open || !isClient) return null;

  function handleBackdropClick(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) onClose();
  }

  return createPortal(
    <div className="fixed inset-0 z-[var(--z-modal)]">
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-overlay-backdrop"
        onClick={handleBackdropClick}
      />
      <div
        ref={mergedRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(drawerPanelVariants({ side }), className)}
        {...props}
      >
        <div className="flex items-center justify-between gap-4 border-b border-border-default px-4 py-3">
          <Text as="h2" id={titleId} size="heading-sm" weight="semibold">
            {title}
          </Text>
          <IconButton
            icon={X}
            aria-label={closeLabel}
            variant="ghost"
            onClick={onClose}
          />
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
