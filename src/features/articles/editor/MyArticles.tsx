"use client";

import { useState } from "react";
import Link from "next/link";
import { Archive, Pencil, Plus, Trash2 } from "lucide-react";
import {
  Alert,
  AlertDialog,
  Badge,
  EmptyState,
  IconButton,
  Skeleton,
  Text,
  buttonVariants,
  cn,
} from "@/design-system";
import { useAdminQuery } from "@/features/admin/useAdminQuery";
import { archiveArticle, deleteArticle, listMine } from "../articlesApi";
import { formatDate } from "../format";
import {
  STATUS_LABELS,
  VISIBILITY_LABELS,
  type ArticleCardData,
} from "../types";

/** The signed-in author's articles in every state, with a way to write a new one. */
export function MyArticles() {
  const mine = useAdminQuery(listMine, "my-articles");
  const [deleting, setDeleting] = useState<ArticleCardData>();
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string>();

  async function run(action: () => Promise<unknown>) {
    setIsBusy(true);
    setError(undefined);
    try {
      await action();
      setDeleting(undefined);
      mine.reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Có lỗi xảy ra.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/write/new"
          className={cn(buttonVariants({ variant: "accent" }))}
        >
          <Plus aria-hidden="true" size={18} />
          Viết bài mới
        </Link>
      </div>
      {error && <Alert variant="danger">{error}</Alert>}
      {mine.error && !mine.data ? (
        <Alert variant="danger">{mine.error.message}</Alert>
      ) : !mine.data ? (
        <Skeleton className="h-40 w-full" />
      ) : mine.data.length === 0 ? (
        <EmptyState
          title="Bạn chưa viết bài nào"
          description="Bấm “Viết bài mới” để bắt đầu."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {mine.data.map((article) => (
            <li
              key={article.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-standard border-2 border-border-strong bg-surface-card p-4 shadow-raised"
            >
              <div className="flex min-w-0 flex-col gap-1">
                <Text weight="bold" className="font-display break-words">
                  {article.title}
                </Text>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    size="sm"
                    variant={
                      article.status === "PUBLISHED" ? "lime" : "default"
                    }
                  >
                    {STATUS_LABELS[article.status]}
                  </Badge>
                  <Badge size="sm">
                    {VISIBILITY_LABELS[article.visibility]}
                  </Badge>
                  {article.publishedAt && (
                    <Text size="body-sm" color="secondary">
                      {formatDate(article.publishedAt)}
                    </Text>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                <Link
                  href={`/write/${article.id}`}
                  aria-label={`Sửa bài: ${article.title}`}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "compact" }),
                  )}
                >
                  <Pencil aria-hidden="true" size={16} />
                  Sửa
                </Link>
                {article.status === "PUBLISHED" && (
                  <IconButton
                    icon={Archive}
                    variant="ghost"
                    size="compact"
                    aria-label={`Lưu trữ bài: ${article.title}`}
                    onClick={() => run(() => archiveArticle(article.id))}
                  />
                )}
                <IconButton
                  icon={Trash2}
                  variant="ghost"
                  size="compact"
                  aria-label={`Xoá bài: ${article.title}`}
                  onClick={() => setDeleting(article)}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
      <AlertDialog
        open={deleting !== undefined}
        variant="destructive"
        title="Xoá bài viết này?"
        description={
          deleting
            ? `“${deleting.title}” cùng bình luận và lịch sử phiên bản sẽ bị xoá vĩnh viễn.`
            : undefined
        }
        confirmLabel="Xoá"
        cancelLabel="Huỷ"
        isLoading={isBusy}
        onConfirm={() => deleting && run(() => deleteArticle(deleting.id))}
        onCancel={() => setDeleting(undefined)}
      />
    </div>
  );
}
