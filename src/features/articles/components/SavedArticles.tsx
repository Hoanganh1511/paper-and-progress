"use client";

import { Alert, Button, EmptyState, Skeleton } from "@/design-system";
import { useAdminQuery } from "@/features/admin/useAdminQuery";
import { listSaved } from "../articlesApi";
import type { ArticleCardData } from "../types";
import { ArticleCard } from "./ArticleCard";

/** The articles the signed-in user saved, newest first. */
export function SavedArticles() {
  const saved = useAdminQuery(listSaved, "saved-articles");

  if (saved.error && !saved.data) {
    return (
      <Alert variant="danger" title="Không tải được bài đã lưu">
        <div className="flex flex-wrap items-center gap-3">
          <span>{saved.error.message}</span>
          <Button size="compact" variant="outline" onClick={saved.reload}>
            Thử lại
          </Button>
        </div>
      </Alert>
    );
  }
  if (!saved.data) {
    return (
      <div aria-busy="true">
        <span role="status" className="sr-only">
          Đang tải
        </span>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (saved.data.length === 0) {
    return (
      <EmptyState
        title="Chưa lưu bài viết nào"
        description="Bấm “Lưu bài” khi đọc để xem lại ở đây."
      />
    );
  }
  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {saved.data.map((article) => (
        <li key={article.id}>
          <ArticleCard
            article={
              {
                ...article,
                status: "PUBLISHED",
                viewCount: 0,
                seriesOrder: null,
                author: { id: "", displayName: null },
                tags: [],
                series: null,
              } as ArticleCardData
            }
          />
        </li>
      ))}
    </ul>
  );
}
