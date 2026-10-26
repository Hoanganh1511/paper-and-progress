"use client";

import {
  cloneElement,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../../utils/cn";

// Class names are written out in full so Tailwind can detect them statically.
// The padding on the positioner bridges the gap to the trigger, so the pointer
// can move onto the tooltip without closing it (WCAG 1.4.13 "hoverable").
const positionerVariants = cva("absolute z-[var(--z-toast)]", {
  variants: {
    placement: {
      top: "bottom-full left-1/2 -translate-x-1/2 pb-2",
      bottom: "top-full left-1/2 -translate-x-1/2 pt-2",
      left: "top-1/2 right-full -translate-y-1/2 pr-2",
      right: "top-1/2 left-full -translate-y-1/2 pl-2",
    },
  },
  defaultVariants: {
    placement: "top",
  },
});

export type TooltipPlacement = NonNullable<
  VariantProps<typeof positionerVariants>["placement"]
>;

export interface TooltipProps extends Omit<
  ComponentProps<"span">,
  "content" | "onMouseEnter" | "onMouseLeave" | "onFocus" | "onBlur"
> {
  content: ReactNode;
  placement?: TooltipPlacement;
  /** Milliseconds to wait before showing. Hiding is immediate. */
  delay?: number;
  /** A single focusable element that the tooltip describes. */
  children: ReactElement<{ "aria-describedby"?: string }>;
}

/**
 * Shows on hover and keyboard focus of `children`, hides on leave, blur and
 * Escape. The tooltip describes the trigger (aria-describedby) rather than
 * naming it, so the trigger still needs its own accessible name. `className`
 * and `ref` apply to the wrapping <span>.
 */
export function Tooltip({
  content,
  placement,
  delay = 200,
  className,
  children,
  ref,
  ...props
}: TooltipProps) {
  const id = useId();
  const [isOpen, setIsOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  function clearTimer() {
    clearTimeout(timerRef.current);
  }

  function show() {
    clearTimer();
    if (delay <= 0) {
      setIsOpen(true);
      return;
    }
    timerRef.current = setTimeout(() => setIsOpen(true), delay);
  }

  function hide() {
    clearTimer();
    setIsOpen(false);
  }

  useEffect(() => clearTimer, []);

  // Capture phase so Escape closes the tooltip first and not, say, the dialog
  // the trigger sits in.
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      setIsOpen(false);
    }

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [isOpen]);

  const hasContent =
    content !== null && content !== undefined && content !== "";
  const isVisible = isOpen && hasContent;
  const describedBy =
    [children.props["aria-describedby"], isVisible ? id : undefined]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <span
      ref={ref}
      className={cn("relative inline-flex", className)}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      {...props}
    >
      {cloneElement(children, { "aria-describedby": describedBy })}
      {isVisible && (
        <span className={positionerVariants({ placement })}>
          <span
            id={id}
            role="tooltip"
            className="block w-max max-w-64 rounded-sharp bg-action-primary px-2 py-1 font-body text-caption text-text-inverse shadow-floating"
          >
            {content}
          </span>
        </span>
      )}
    </span>
  );
}
