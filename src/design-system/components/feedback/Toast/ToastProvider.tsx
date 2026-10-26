"use client";

import {
  useCallback,
  useMemo,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "../../../utils/cn";
import { useIsClient } from "../../../hooks/useIsClient";
import { Toast, DEFAULT_TOAST_DURATION } from "./Toast";
import { ToastContext, type ToastOptions } from "./ToastContext";

interface ToastEntry extends ToastOptions {
  id: string;
}

let toastCount = 0;

export interface ToastProviderProps extends Omit<
  ComponentProps<"div">,
  "children"
> {
  children: ReactNode;
  /** How many toasts show at once; the rest wait in a queue. */
  maxVisible?: number;
  /** Default `duration` of toasts that do not set their own. */
  duration?: number;
  /** Accessible name of the notifications region. */
  label?: string;
  dismissLabel?: string;
}

/**
 * Provides `useToast` and renders the toasts in a fixed region at the bottom
 * of the screen (bottom right from `sm`). At most `maxVisible` (3) show at
 * once, oldest first; a queued toast appears, and its timer starts, only when
 * there is room. `className` and `ref` apply to the region.
 */
export function ToastProvider({
  children,
  maxVisible = 3,
  duration = DEFAULT_TOAST_DURATION,
  label = "Notifications",
  dismissLabel,
  className,
  ref,
  ...props
}: ToastProviderProps) {
  const isClient = useIsClient();
  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((entry) => entry.id !== id));
  }, []);

  const dismissAll = useCallback(() => setToasts([]), []);

  const toast = useCallback((options: ToastOptions) => {
    toastCount += 1;
    const id = `toast-${toastCount}`;
    setToasts((current) => [...current, { id, ...options }]);
    return id;
  }, []);

  const context = useMemo(
    () => ({ toast, dismiss, dismissAll }),
    [toast, dismiss, dismissAll],
  );

  const visibleToasts = toasts.slice(0, maxVisible);

  return (
    <ToastContext value={context}>
      {children}
      {isClient &&
        visibleToasts.length > 0 &&
        createPortal(
          <div
            ref={ref}
            role="region"
            aria-label={label}
            className={cn(
              "pointer-events-none fixed inset-x-4 bottom-4 z-[var(--z-toast)] flex flex-col gap-2 sm:inset-x-auto sm:right-4 sm:w-96",
              className,
            )}
            {...props}
          >
            {visibleToasts.map((entry) => (
              <Toast
                key={entry.id}
                variant={entry.variant}
                title={entry.title}
                description={entry.description}
                duration={entry.duration ?? duration}
                dismissLabel={dismissLabel}
                onDismiss={() => dismiss(entry.id)}
              />
            ))}
          </div>,
          document.body,
        )}
    </ToastContext>
  );
}
