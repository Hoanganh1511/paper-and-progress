"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** The width of the stage when nothing is measured yet, so the server and the first paint agree. */
const FIRST_WIDTH = 1000;

/**
 * Which series is in front. `next` and `previous` wrap round, `goTo` brings a
 * given one forward. The number of series can change under it (a list is
 * added or removed), so the place is kept inside it.
 */
export function useSeriesCarousel(count: number) {
  const [requested, setRequested] = useState(0);
  const active = count === 0 ? 0 : Math.min(requested, count - 1);

  const goTo = useCallback(
    (index: number) => {
      if (count === 0) return;
      setRequested(((index % count) + count) % count);
    },
    [count],
  );
  const next = useCallback(() => goTo(active + 1), [goTo, active]);
  const previous = useCallback(() => goTo(active - 1), [goTo, active]);

  return { active, goTo, next, previous };
}

/** The width of the element, so the cards follow the room the module has and not the screen. */
export function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(FIRST_WIDTH);
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return { ref, width };
}
