"use client";

import { useState } from "react";
import { Alert, Button, EmptyState } from "@/design-system";
import { fetchArticlePage } from "../articlesApi";
import type { ArticleList as ArticleListData } from "../types";
import { ArticleCard } from "./ArticleCard";

export interface ArticleListProps {
  /** The first page, read on the server and cached. */
  initial: ArticleListData;
  /** The filters the list was built with, so "load more" asks for the same ones. */
  query: { tag?: string; series?: string; q?: string };
}

/** The cards, plus a "load more" button that follows the cursor (simpler and easier to reach by keyboard than endless scroll). */
export function ArticleList({ initial, query }: ArticleListProps) {
  const [items, setItems] = useState(initial.items);
  const [cursor, setCursor] = useState(initial.nextCursor);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();

  async function loadMore() {
    if (!cursor) return;
    setIsLoading(true);
    setError(undefined);
    try {
      const next = await fetchArticlePage({ ...query, cursor });
      setItems((current) => [...current, ...next.items]);
      setCursor(next.nextCursor);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Không tải thêm được.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="Chưa có bài viết nào"
        description={
          query.q || query.tag || query.series
            ? "Không có bài nào khớp bộ lọc này. Thử bỏ bớt bộ lọc."
            : "Các bài viết sẽ xuất hiện ở đây khi được đăng."
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((article) => (
          <li key={article.id}>
            <ArticleCard article={article} />
          </li>
        ))}
      </ul>
      {error && <Alert variant="danger">{error}</Alert>}
      {cursor && (
        <div className="flex justify-center">
          <Button variant="outline" isLoading={isLoading} onClick={loadMore}>
            Tải thêm bài viết
          </Button>
        </div>
      )}
    </div>
  );
}
