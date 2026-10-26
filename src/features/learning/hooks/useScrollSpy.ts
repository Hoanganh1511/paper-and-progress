"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/design-system";

// A section counts as reached once its top is within this many px of the line
// where scrolling to it would put it (its scroll-margin-top).
const REACHED_TOLERANCE_PX = 8;
// After a click, ignore scroll events until the scrolling has been idle this long.
const UNLOCK_AFTER_IDLE_MS = 150;

/**
 * Tracks which of the elements with the given ids is "current" while the page
 * scrolls, and scrolls to one on request.
 *
 * - The current section is the last one whose top has passed its
 *   `scroll-margin-top` line, so the CSS that positions `scrollIntoView` also
 *   decides when a section becomes active. At the very bottom of the page the
 *   last section is current, even if it is too short to reach the line.
 * - `goTo(id)` marks the section active at once and pauses tracking until the
 *   smooth scroll settles, so the highlight does not flicker through the
 *   sections in between. It scrolls without animation when the user prefers
 *   reduced motion.
 */
export function useScrollSpy(ids: string[]) {
  const [activeId, setActiveId] = useState<string | undefined>(ids[0]);
  const isLockedRef = useRef(false);
  const unlockTimerRef = useRef<number>(undefined);
  const prefersReducedMotion = usePrefersReducedMotion();

  const scheduleUnlock = useCallback(() => {
    window.clearTimeout(unlockTimerRef.current);
    unlockTimerRef.current = window.setTimeout(() => {
      isLockedRef.current = false;
    }, UNLOCK_AFTER_IDLE_MS);
  }, []);

  useEffect(() => {
    let frame = 0;

    function update() {
      if (ids.length === 0) return;
      const isAtBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2;
      let current = ids[0];

      if (isAtBottom && window.scrollY > 0) {
        current = ids[ids.length - 1];
      } else {
        for (const id of ids) {
          const element = document.getElementById(id);
          if (!element) continue;
          const line =
            parseFloat(getComputedStyle(element).scrollMarginTop) || 0;
          if (
            element.getBoundingClientRect().top <=
            line + REACHED_TOLERANCE_PX
          ) {
            current = id;
          }
        }
      }
      setActiveId(current);
    }

    function handleScroll() {
      if (isLockedRef.current) {
        scheduleUnlock();
        return;
      }
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    }

    update();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(unlockTimerRef.current);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [ids, scheduleUnlock]);

  /** Scrolls the section into view; returns it (or null if it does not exist). */
  const goTo = useCallback(
    (id: string) => {
      const element = document.getElementById(id);
      if (!element) return null;
      isLockedRef.current = true;
      setActiveId(id);
      scheduleUnlock();
      element.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });
      return element;
    },
    [prefersReducedMotion, scheduleUnlock],
  );

  return { activeId, goTo };
}
