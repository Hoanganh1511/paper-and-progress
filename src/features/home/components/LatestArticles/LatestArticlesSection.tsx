"use client";

import { LinkButton, Text } from "@/design-system";
import { useAdminQuery } from "@/features/admin/useAdminQuery";
import { useAuth } from "@/features/auth";
import { getStudyList, listStudyLists } from "@/features/study-lists";
import type { StudyListDetail } from "@/features/study-lists";
import { LatestArticles, type LatestArticlesProps } from "./LatestArticles";
import { LatestArticlesSkeleton } from "./LatestArticlesSkeleton";
import { MAX_SERIES, STEPS_PER_SERIES } from "./carouselLayout";
import type { SeriesShowcase } from "./types";

/** The first lessons of a list, in the order the learner set them (across its sections). */
function toShowcase(list: StudyListDetail): SeriesShowcase {
  const steps = list.sections
    .flatMap((section) => section.steps)
    .slice(0, STEPS_PER_SERIES)
    .map((step) => ({
      id: step.id,
      title: step.article?.title ?? step.title,
      href: step.article
        ? `/articles/${step.article.slug}`
        : `/study-lists/${list.id}`,
      minutes: step.article?.readingMinutes ?? null,
      isDone: step.isDone,
    }));
  return {
    id: list.id,
    title: list.title,
    description: list.description,
    sectionCount: list.sectionCount,
    stepCount: list.stepCount,
    steps,
  };
}

/** Reads the learner's study lists and the first lessons of each one. A list that cannot be read is left out, so the others still show. */
async function loadSeries(): Promise<SeriesShowcase[]> {
  const lists = (await listStudyLists())
    .filter((list) => list.stepCount > 0)
    .slice(0, MAX_SERIES);
  const details = await Promise.all(
    lists.map((list) => getStudyList(list.id).catch(() => null)),
  );
  return details.filter((item) => item !== null).map(toShowcase);
}

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
    () => (isAuthenticated ? loadSeries() : Promise.resolve([])),
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
            <Text className="text-white">
              Chưa có danh sách học nào có bài. Tạo một danh sách để nó hiện ở
              đây.
            </Text>
            <LinkButton href="/learn?tab=lists" size="compact" variant="accent">
              Tạo danh sách học
            </LinkButton>
          </>
        ) : (
          <>
            <Text className="text-white">
              Đăng nhập để xem các series (danh sách học) của bạn.
            </Text>
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
