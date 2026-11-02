"use client";

import { useEffect } from "react";
import { trackScroll } from "./articlesApi";
import { scrollPercent } from "./components/ReadingProgress";

const MILESTONES = [25, 50, 75, 100] as const;

/**
 * Tells the backend an article was opened (0), then how far the reader got
 * (25, 50, 75, 100), each milestone once. Used for the admin's read-completion stats.
 */
export function useReadTracking(articleId: string, isActive: boolean) {
  useEffect(() => {
    if (!isActive) return;
    trackScroll(articleId, 0);
    const sent = new Set<number>();
    const onScroll = () => {
      const percent = scrollPercent(
        window.scrollY,
        document.documentElement.scrollHeight,
        window.innerHeight,
      );
      for (const milestone of MILESTONES) {
        if (percent >= milestone && !sent.has(milestone)) {
          sent.add(milestone);
          trackScroll(articleId, milestone);
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [articleId, isActive]);
}
