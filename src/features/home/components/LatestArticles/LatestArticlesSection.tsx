"use client";

import { LinkButton, Text } from "@/design-system";
import { useAdminQuery } from "@/features/admin/useAdminQuery";
import { useAuth } from "@/features/auth";
import { loadSeriesShowcases } from "@/features/study-lists";
import { LatestArticles, type LatestArticlesProps } from "./LatestArticles";
import { LatestArticlesSkeleton } from "./LatestArticlesSkeleton";
import { MAX_SERIES } from "./carouselLayout";

/**
 * The showcase on the home page, fed by the learner's own study lists. Lists
 * need a sign-in, so a visitor sees a prompt instead of the cards. A failed
 * read becomes the showcase's own error state, not an error of the whole page.
 */
export function LatestArticlesSection(
  props: Omit<LatestArticlesProps, "series" | "emptyContent">,
) {
  const { isAuthenticated, isLoading } = useAuth();
  const query = useAdminQuery(
    () =>
      isAuthenticated
        ? loadSeriesShowcases({ limit: MAX_SERIES })
        : Promise.resolve([]),
    `home-series-${isAuthenticated}`,
  );

  if (isLoading || (isAuthenticated && !query.data && !query.error)) {
    return <LatestArticlesSkeleton {...props} />;
  }

  return (
    <LatestArticles
      series={query.error && !query.data ? null : (query.data ?? [])}
      emptyContent={
        isAuthenticated ? (
          <>
            <Text>
              Chưa có danh sách học nào có bài. Tạo một danh sách để nó hiện ở
              đây.
            </Text>
            <LinkButton href="/learn?tab=lists" size="compact" variant="accent">
              Tạo danh sách học
            </LinkButton>
          </>
        ) : (
          <>
            <Text>Đăng nhập để xem các series (danh sách học) của bạn.</Text>
            <LinkButton href="/login" size="compact" variant="accent">
              Đăng nhập
            </LinkButton>
          </>
        )
      }
      {...props}
    />
  );
}
