"use client";

import { useEffect, useRef, useState } from "react";

/** How far through the page the reader has scrolled, 0 to 100. */
export function scrollPercent(
  scrollY: number,
  scrollHeight: number,
  viewportHeight: number,
) {
  const scrollable = scrollHeight - viewportHeight;
  if (scrollable <= 0) return 100;
  return Math.min(100, Math.max(0, (scrollY / scrollable) * 100));
}

/** A thin bar under the header that fills as the page scrolls. */
export function ReadingProgress() {
  const [percent, setPercent] = useState(0);
  const frame = useRef(0);

  useEffect(() => {
    const update = () => {
      frame.current = 0;
      setPercent(
        scrollPercent(
          window.scrollY,
          document.documentElement.scrollHeight,
          window.innerHeight,
        ),
      );
    };
    const onScroll = () => {
      if (!frame.current) frame.current = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame.current);
    };
  }, []);

  return (
    <div
      role="progressbar"
      aria-label="Tiến độ đọc"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(percent)}
      className="pointer-events-none fixed inset-x-0 top-[var(--app-header-height,4rem)] z-30 h-1 bg-transparent"
    >
      <div
        className="h-full bg-accent-lime transition-[width] duration-100 motion-reduce:transition-none"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
