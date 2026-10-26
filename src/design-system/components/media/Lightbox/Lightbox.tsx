"use client";

import {
  useEffect,
  useMemo,
  useRef,
  type ComponentProps,
  type MouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "../../../utils/cn";
import { mergeRefs } from "../../../utils/mergeRefs";
import { useEscapeKey } from "../../../hooks/useEscapeKey";
import { useFocusTrap } from "../../../hooks/useFocusTrap";
import { useIsClient } from "../../../hooks/useIsClient";
import { useOverlayLayer } from "../../../hooks/useOverlayLayer";
import { useScrollLock } from "../../../hooks/useScrollLock";
import { IconButton } from "../../actions/Button/IconButton";

export interface LightboxItem {
  src: string;
  /** Describes the image. */
  alt: string;
  caption?: ReactNode;
}

export interface LightboxLabels {
  dialog: string;
  close: string;
  previous: string;
  next: string;
  /** `{current}` and `{total}` are replaced with the position. */
  counter: string;
}

export const defaultLightboxLabels: LightboxLabels = {
  dialog: "Image viewer",
  close: "Close",
  previous: "Previous image",
  next: "Next image",
  counter: "Image {current} of {total}",
};

export interface LightboxProps extends Omit<
  ComponentProps<"div">,
  "role" | "children"
> {
  open: boolean;
  onClose: () => void;
  items: LightboxItem[];
  /** Index of the image being shown. */
  index: number;
  onIndexChange: (index: number) => void;
  /** Replace any of the texts (translations). */
  labels?: Partial<LightboxLabels>;
}

// White controls on the dark backdrop; the default ghost color would vanish.
const controlClasses = "text-white hover:bg-white/15 active:bg-white/25";

/**
 * Full-screen image viewer. It is a modal dialog: focus stays inside, Escape
 * or a click on the dark area closes it, the page behind does not scroll,
 * and focus returns to what opened it. With several images, the arrow buttons
 * and the Left/Right keys move between them. `className` and `ref` apply to
 * the dialog.
 */
export function Lightbox({
  open,
  onClose,
  items,
  index,
  onIndexChange,
  labels: labelOverrides,
  className,
  ref,
  ...props
}: LightboxProps) {
  const labels = { ...defaultLightboxLabels, ...labelOverrides };
  const isClient = useIsClient();
  const dialogRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMemo(() => mergeRefs(dialogRef, ref), [ref]);

  const isTopmost = useOverlayLayer(open);
  useFocusTrap(dialogRef, open, isTopmost);
  useEscapeKey(open, onClose, isTopmost);
  useScrollLock(open);

  const total = items.length;
  const current = items[index];
  const hasPrevious = index > 0;
  const hasNext = index < total - 1;

  useEffect(() => {
    if (!open || total < 2) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (!isTopmost() || event.defaultPrevented) return;
      if (event.key === "ArrowLeft" && index > 0) {
        event.preventDefault();
        onIndexChange(index - 1);
      } else if (event.key === "ArrowRight" && index < total - 1) {
        event.preventDefault();
        onIndexChange(index + 1);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, total, index, onIndexChange, isTopmost]);

  if (!open || !isClient || !current) return null;

  // Clicks on the empty dark area (not on the image or buttons) close it.
  function closeOnBlankClick(event: MouseEvent<HTMLElement>) {
    if (event.target === event.currentTarget) onClose();
  }

  return createPortal(
    <div
      ref={mergedRef}
      role="dialog"
      aria-modal="true"
      aria-label={labels.dialog}
      tabIndex={-1}
      className={cn(
        "fixed inset-0 z-[var(--z-modal)] flex flex-col bg-black/90 outline-none",
        className,
      )}
      onClick={closeOnBlankClick}
      {...props}
    >
      <div className="flex items-center justify-between gap-4 p-2">
        {total > 1 ? (
          <p
            aria-live="polite"
            className="px-2 font-body text-body-sm text-white"
          >
            {labels.counter
              .replace("{current}", String(index + 1))
              .replace("{total}", String(total))}
          </p>
        ) : (
          <span />
        )}
        <IconButton
          icon={X}
          aria-label={labels.close}
          variant="ghost"
          className={controlClasses}
          onClick={onClose}
        />
      </div>

      <div
        className="flex min-h-0 flex-1 items-center justify-between gap-2 px-2"
        onClick={closeOnBlankClick}
      >
        {total > 1 ? (
          <IconButton
            icon={ChevronLeft}
            aria-label={labels.previous}
            variant="ghost"
            size="comfortable"
            className={controlClasses}
            disabled={!hasPrevious}
            onClick={() => onIndexChange(index - 1)}
          />
        ) : (
          <span />
        )}
        <figure
          className="flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center gap-3"
          onClick={closeOnBlankClick}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- a framework-free component */}
          <img
            key={current.src}
            src={current.src}
            alt={current.alt}
            className="min-h-0 max-h-full max-w-full rounded-sharp object-contain"
          />
          {current.caption && (
            <figcaption className="max-w-prose text-center font-body text-body-md text-white">
              {current.caption}
            </figcaption>
          )}
        </figure>
        {total > 1 ? (
          <IconButton
            icon={ChevronRight}
            aria-label={labels.next}
            variant="ghost"
            size="comfortable"
            className={controlClasses}
            disabled={!hasNext}
            onClick={() => onIndexChange(index + 1)}
          />
        ) : (
          <span />
        )}
      </div>
    </div>,
    document.body,
  );
}
