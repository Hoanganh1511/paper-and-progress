"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { loginHref, useAuth } from "@/features/auth";
import {
  bookmark,
  getEngagement,
  react,
  unbookmark,
  unreact,
} from "./articlesApi";
import type { Engagement, ReactionType } from "./types";

const EMPTY: Engagement = {
  counts: { LIKE: 0, LOVE: 0, INSIGHTFUL: 0, CELEBRATE: 0 },
  mine: [],
  isBookmarked: false,
};

/**
 * Reactions and the bookmark of one article. A press shows at once and is put
 * back if the server refuses; a guest is sent to sign in.
 */
export function useEngagement(articleId: string) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();
  const [engagement, setEngagement] = useState<Engagement>(EMPTY);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (isLoading) return;
    let isCurrent = true;
    getEngagement(articleId)
      .then((data) => isCurrent && setEngagement(data))
      .catch(() => undefined);
    return () => {
      isCurrent = false;
    };
  }, [articleId, isAuthenticated, isLoading]);

  const requireLogin = useCallback(() => {
    if (isAuthenticated) return true;
    // Back to this article once they have signed in.
    router.push(loginHref(pathname));
    return false;
  }, [isAuthenticated, router, pathname]);

  const toggleReaction = useCallback(
    async (type: ReactionType) => {
      if (!requireLogin()) return;
      const previous = engagement;
      const isOn = previous.mine.includes(type);
      setError(undefined);
      setEngagement({
        ...previous,
        counts: {
          ...previous.counts,
          [type]: Math.max(0, previous.counts[type] + (isOn ? -1 : 1)),
        },
        mine: isOn
          ? previous.mine.filter((item) => item !== type)
          : [...previous.mine, type],
      });
      try {
        setEngagement(
          await (isOn ? unreact(articleId, type) : react(articleId, type)),
        );
      } catch (caught) {
        setEngagement(previous);
        setError(
          caught instanceof Error ? caught.message : "Không lưu được lựa chọn.",
        );
      }
    },
    [articleId, engagement, requireLogin],
  );

  const toggleBookmark = useCallback(async () => {
    if (!requireLogin()) return;
    const previous = engagement;
    setError(undefined);
    setEngagement({ ...previous, isBookmarked: !previous.isBookmarked });
    try {
      await (previous.isBookmarked
        ? unbookmark(articleId)
        : bookmark(articleId));
    } catch (caught) {
      setEngagement(previous);
      setError(
        caught instanceof Error ? caught.message : "Không lưu được bookmark.",
      );
    }
  }, [articleId, engagement, requireLogin]);

  return { engagement, error, toggleReaction, toggleBookmark };
}
