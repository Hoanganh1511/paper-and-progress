"use client";

import { Alert, Badge, Skeleton, Text } from "@/design-system";
import { useAdminQuery } from "@/features/admin/useAdminQuery";
import { getEditable } from "../articlesApi";
import { extractToc } from "../toc";
import { ArticleBody } from "../components/ArticleBody";
import { TableOfContents } from "../components/TableOfContents";
import { STATUS_LABELS } from "../types";

/** The author's own view of an article exactly as readers get it, for drafts too. Not indexed, not cached. */
export function ArticlePreview({ id }: { id: string }) {
  const article = useAdminQuery(() => getEditable(id), `preview-${id}`);

  if (article.error && !article.data) {
    return <Alert variant="danger">{article.error.message}</Alert>;
  }
  if (!article.data) return <Skeleton className="h-96 w-full" />;
  const { data } = article;
  return (
    <div className="flex flex-col gap-6">
      <Alert variant="info">
        Đây là bản xem trước ({STATUS_LABELS[data.status]}). Chỉ bạn thấy được
        trang này.
      </Alert>
      <header className="flex flex-col gap-3">
        <Text as="h1" size="heading-xl" weight="bold" className="font-display">
          {data.title}
        </Text>
        {data.excerpt && (
          <Text size="body-lg" color="secondary">
            {data.excerpt}
          </Text>
        )}
        <ul className="flex flex-wrap gap-1.5" aria-label="Chủ đề">
          {data.tags.map((tag) => (
            <li key={tag.slug}>
              <Badge size="sm">{tag.name}</Badge>
            </li>
          ))}
        </ul>
      </header>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <ArticleBody html={data.contentHtml} />
        <aside>
          <div className="sticky top-[calc(var(--app-header-height,4rem)+1.5rem)]">
            <TableOfContents items={extractToc(data.contentHtml)} />
          </div>
        </aside>
      </div>
    </div>
  );
}
