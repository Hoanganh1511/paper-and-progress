"use client";

import {
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../../utils/cn";
import { IconButton } from "../../actions/Button/IconButton";

// Class names are written out in full so Tailwind can detect them statically.
const toastVariants = cva(
  [
    "pointer-events-auto flex w-full items-start gap-3 rounded-standard border-2 p-4 font-body shadow-floating",
    "transition-[opacity,translate] duration-[var(--duration-normal)] ease-[var(--ease-default)] starting:translate-y-2 starting:opacity-0 motion-reduce:transition-none",
  ],
  {
    variants: {
      variant: {
        info: "border-info-text bg-info-bg text-info-text",
        success: "border-success-text bg-success-bg text-success-text",
        warning: "border-warning-text bg-warning-bg text-warning-text",
        danger: "border-danger-text bg-danger-bg text-danger-text",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  },
);

// A different icon per variant, so the status never relies on color alone.
const VARIANT_ICONS = {
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  danger: CircleAlert,
} as const;

export const DEFAULT_TOAST_DURATION = 5000;

export type ToastVariant = NonNullable<
  VariantProps<typeof toastVariants>["variant"]
>;

export interface ToastProps
  extends
    Omit<
      ComponentProps<"div">,
      "title" | "role" | "onMouseEnter" | "onMouseLeave" | "onFocus" | "onBlur"
    >,
    VariantProps<typeof toastVariants> {
  title: ReactNode;
  description?: ReactNode;
  /** Milliseconds before `onDismiss` is called. 0 keeps the toast until dismissed. */
  duration?: number;
  onDismiss?: () => void;
  dismissLabel?: string;
}

/**
 * One notification. The auto-dismiss timer pauses while the pointer is over
 * the toast or focus is inside it, and restarts when they leave.
 */
export function Toast({
  variant,
  title,
  description,
  duration = DEFAULT_TOAST_DURATION,
  onDismiss,
  dismissLabel = "Dismiss",
  className,
  ref,
  ...props
}: ToastProps) {
  const [isPaused, setIsPaused] = useState(false);

  // Always call the latest handler without restarting the timer when it changes.
  const onDismissRef = useRef(onDismiss);
  useEffect(() => {
    onDismissRef.current = onDismiss;
  });

  useEffect(() => {
    if (isPaused || !(duration > 0) || !Number.isFinite(duration)) return;
    const timer = setTimeout(() => onDismissRef.current?.(), duration);
    return () => clearTimeout(timer);
  }, [isPaused, duration]);

  const Icon = VARIANT_ICONS[variant ?? "info"];

  return (
    <div
      ref={ref}
      role="alert"
      aria-live="polite"
      className={cn(toastVariants({ variant }), className)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      {...props}
    >
      <Icon aria-hidden="true" size={20} className="mt-0.5 shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-body-md font-semibold">{title}</p>
        {description && <p className="text-body-sm">{description}</p>}
      </div>
      {onDismiss && (
        <IconButton
          icon={X}
          aria-label={dismissLabel}
          variant="ghost"
          size="compact"
          className="-mt-1 -mr-2 text-current"
          onClick={onDismiss}
        />
      )}
    </div>
  );
}
