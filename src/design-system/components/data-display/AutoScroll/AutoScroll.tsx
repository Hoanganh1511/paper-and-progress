"use client";

import {
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
} from "react";
import { cn } from "../../../utils/cn";
import { usePrefersReducedMotion } from "../../../hooks/usePrefersReducedMotion";
import { focusRingClasses } from "../../../primitives/FocusRing";

export interface AutoScrollProps extends Omit<
  ComponentProps<"div">,
  "children"
> {
  children: ReactNode;
  /** Scroll speed in pixels per second. */
  speed?: number;
  /** Stops the movement; it carries on from the same place. */
  isPaused?: boolean;
  /** Called when the content starts or stops moving (it only moves when it does not fit). */
  onActiveChange?: (isActive: boolean) => void;
}

/**
 * A fixed-height window onto content that drifts upwards by itself and starts
 * over from the top when it reaches the end, with no jump. It only moves when
 * the content is taller than the window; shorter content stays still. The
 * movement stops while the pointer is over it or focus is inside it, and with
 * `isPaused`.
 *
 * The loop works by rendering the content twice and moving by one copy; the
 * second copy is hidden from assistive technology and cannot take focus.
 * With reduced motion nothing moves: the window scrolls by hand instead.
 * Give it a height (and `aria-label` with `role="region"` if it needs a name).
 */
export function AutoScroll({
  children,
  speed = 24,
  isPaused = false,
  onActiveChange,
  className,
  style,
  ref,
  ...props
}: AutoScrollProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const onActiveChangeRef = useRef(onActiveChange);
  const [distance, setDistance] = useState(0);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    onActiveChangeRef.current = onActiveChange;
  });

  // The observer reports once when it starts watching, then on every resize.
  useEffect(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!viewport || !content || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      setDistance(
        content.offsetHeight > viewport.clientHeight ? content.offsetHeight : 0,
      );
    });
    observer.observe(viewport);
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  const isOverflowing = distance > 0;
  const isMoving = isOverflowing && !prefersReducedMotion;

  useEffect(() => {
    onActiveChangeRef.current?.(isMoving);
  }, [isMoving]);

  return (
    <div
      ref={(node) => {
        viewportRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      // Reduced motion: the window is an ordinary scroll area, so keyboard users can reach it.
      tabIndex={isOverflowing && prefersReducedMotion ? 0 : undefined}
      className={cn(
        "relative",
        isOverflowing && prefersReducedMotion
          ? "overflow-y-auto"
          : "overflow-hidden",
        isMoving &&
          "[mask-image:linear-gradient(to_bottom,transparent,black_6%,black_94%,transparent)] [&:hover>div]:[animation-play-state:paused] [&:focus-within>div]:[animation-play-state:paused]",
        focusRingClasses,
        className,
      )}
      style={style}
      {...props}
    >
      <div
        className={cn(isMoving && "animate-auto-scroll")}
        style={
          isMoving
            ? ({
                "--auto-scroll-distance": `${distance}px`,
                animationDuration: `${distance / speed}s`,
                animationPlayState: isPaused ? "paused" : undefined,
              } as CSSProperties)
            : undefined
        }
      >
        <div ref={contentRef}>{children}</div>
        {isMoving && (
          <div aria-hidden="true" inert>
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
