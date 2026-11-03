"use client";

import { Newspaper } from "lucide-react";
import { Alert, Text } from "@/design-system";
import type { ArticleCardData } from "@/features/articles";
import { useIsMember } from "@/features/membership";
import { LibraryArticleCard } from "./LibraryArticleCard";

export interface LibraryArticlesProps {
  /** The newest published articles; `null` when they could not be loaded. */
  articles: ArticleCardData[] | null;
}

/**
 * The "Bài viết" tab of the knowledge library: a header and the newest three as cards. A failed read stays inside this tab.
 */
export function LibraryArticles({ articles }: LibraryArticlesProps) {
  const isMember = useIsMember();
  return (
    <section
      aria-labelledby="library-articles-title"
      className="flex flex-col gap-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-standard border-2 border-border-strong bg-accent-lime text-ink">
            <Newspaper aria-hidden="true" size={22} />
          </span>
          <div className="min-w-0">
            <Text
              as="h2"
              id="library-articles-title"
              size="heading-lg"
              weight="bold"
              font="display"
            >
              Bài viết
            </Text>
            <Text size="body-sm" color="secondary">
              Ghi chép về học tập, lập trình và những gì mình học được mỗi ngày.
            </Text>
          </div>
        </div>
      </div>
      {articles === null ? (
        <Alert variant="danger">Không tải được các bài viết.</Alert>
      ) : articles.length === 0 ? (
        <Text color="secondary">Chưa có bài viết nào được đăng.</Text>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {articles.map((article, index) => (
            <li key={article.id} className="flex">
              <LibraryArticleCard
                article={article}
                index={index}
                // A member reads all of it, so there is nothing to warn about; until we know, the badge stays.
                showBadge={article.visibility !== "PUBLIC" && isMember !== true}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
