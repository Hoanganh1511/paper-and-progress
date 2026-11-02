"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock, Pencil } from "lucide-react";
import {
  Alert,
  Badge,
  Breadcrumbs,
  Image,
  Text,
  buttonVariants,
  cn,
} from "@/design-system";
import { loginHref, useAuth } from "@/features/auth";
import { ArticlesApiError, getFullArticle } from "../articlesApi";
import { authorName, formatDate } from "../format";
import { extractToc } from "../toc";
import type {
  ArticleCardData,
  ArticleResult,
  FullArticle,
  PreviewArticle,
} from "../types";
import { useEngagement } from "../useEngagement";
import { useReadTracking } from "../useReadTracking";
import { ArticleBody } from "./ArticleBody";
import { ArticleCard } from "./ArticleCard";
import { CommentThread } from "./CommentThread";
import { GatedOverlay } from "./GatedOverlay";
import { ReactionBar } from "./ReactionBar";
import { ReadingProgress } from "./ReadingProgress";
import { TableOfContents } from "./TableOfContents";

type Readable = Extract<ArticleResult, { kind: "full" | "preview" | "locked" }>;

export interface ArticleReaderProps {
  slug: string;
  /** What the cached page holds: only what a guest may see. */
  result: Readable;
}

function SeriesNav({
  series,
  currentSlug,
}: {
  series: NonNullable<FullArticle["series"]>;
  currentSlug: string;
}) {
  return (
    <nav
      aria-label={`Series ${series.title}`}
      className="rounded-standard border-2 border-border-strong bg-surface-card p-4 shadow-raised"
    >
      <Text as="p" size="body-sm" weight="bold" className="mb-2">
        Series: {series.title}
      </Text>
      <ol className="flex flex-col gap-1">
        {series.articles.map((item) => (
          <li key={item.slug}>
            <Link
              href={`/articles/${item.slug}`}
              aria-current={item.slug === currentSlug ? "page" : undefined}
              className={`flex min-h-11 items-center gap-2 rounded-sharp px-2 text-body-sm hover:bg-surface-sunken ${item.slug === currentSlug ? "bg-accent-lime font-semibold text-ink hover:bg-accent-lime" : ""}`}
            >
              <span className="shrink-0">
                {item.seriesOrder ? `Phần ${item.seriesOrder}` : "•"}
              </span>
              <span>{item.title}</span>
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/**
 * The article page body. The server renders what a guest may see (it is cached
 * and shared); once a visitor is known to be signed in, the full text is fetched
 * here with their token and replaces the preview.
 */
export function ArticleReader({ slug, result }: ArticleReaderProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const pathname = usePathname();
  const initialFull = result.kind === "full" ? result.article : undefined;
  const [fetched, setFetched] = useState<FullArticle | PreviewArticle>();
  // The server said no: signed in, but not a member.
  const [isNotMember, setIsNotMember] = useState(false);
  const [loadError, setLoadError] = useState<string>();
  const full = initialFull ?? (fetched && !fetched.gated ? fetched : undefined);

  useEffect(() => {
    if (initialFull || isLoading || !isAuthenticated) return;
    let isCurrent = true;
    getFullArticle(slug)
      .then((article) => {
        if (!isCurrent) return;
        setFetched(article);
        if (article.gated) setIsNotMember(true);
      })
      .catch((error: unknown) => {
        if (!isCurrent) return;
        // A members-only article is a 403 for someone who is not a member.
        if (error instanceof ArticlesApiError && error.status === 403) {
          setIsNotMember(true);
          return;
        }
        setLoadError(
          error instanceof Error ? error.message : "Không tải được bài viết.",
        );
      });
    return () => {
      isCurrent = false;
    };
  }, [slug, initialFull, isAuthenticated, isLoading]);

  const preview: PreviewArticle | undefined =
    result.kind === "preview"
      ? result.article
      : fetched?.gated
        ? fetched
        : undefined;
  const gateReason = !isAuthenticated
    ? ("LOGIN" as const)
    : isNotMember
      ? ("MEMBERSHIP" as const)
      : ("CHECKING" as const);
  const meta = full ?? preview;
  const articleId = meta?.id;
  const toc = useMemo(() => (full ? extractToc(full.contentHtml) : []), [full]);

  useReadTracking(articleId ?? "", Boolean(full && articleId));
  const { engagement, error, toggleReaction, toggleBookmark } = useEngagement(
    articleId ?? "",
  );

  const title =
    meta?.title ?? (result.kind === "locked" ? result.article.title : "");
  const canEdit =
    Boolean(user && meta) &&
    (user?.role === "ADMIN" || user?.id === meta?.authorId);
  const excerpt =
    meta?.excerpt ?? (result.kind === "locked" ? result.article.excerpt : null);

  return (
    <div className="flex flex-col gap-8">
      {full && <ReadingProgress />}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Breadcrumbs
          label="Đường dẫn"
          linkComponent={Link}
          items={[
            { label: "Trang chủ", href: "/" },
            { label: "Thư viện kiến thức", href: "/learn" },
            { label: "Bài viết", href: "/articles" },
            { label: title },
          ]}
          className="min-w-0"
        />
        {canEdit && meta && (
          <Link
            href={`/write/${meta.id}`}
            className={cn(
              buttonVariants({ variant: "outline", size: "compact" }),
            )}
          >
            <Pencil aria-hidden="true" size={16} />
            Sửa bài
          </Link>
        )}
      </div>

      <header className="flex flex-col gap-4">
        {meta?.coverImageUrl && (
          <Image
            src={meta.coverImageUrl}
            alt=""
            aspectRatio="wide"
            loading="eager"
            frameClassName="border-2 border-border-strong"
          />
        )}
        {meta?.series && (
          <Badge variant="blue">
            {meta.series.title}
            {meta.seriesOrder ? ` · Phần ${meta.seriesOrder}` : ""}
          </Badge>
        )}
        <Text as="h1" size="heading-xl" weight="bold" className="font-display">
          {title}
        </Text>
        {excerpt && (
          <Text size="body-lg" color="secondary">
            {excerpt}
          </Text>
        )}
        {meta && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <Text size="body-sm" color="secondary">
              {authorName(meta.author)}
              {meta.publishedAt && ` · ${formatDate(meta.publishedAt)}`}
            </Text>
            <Text
              size="body-sm"
              color="secondary"
              className="inline-flex items-center gap-1"
            >
              <Clock aria-hidden="true" size={14} />
              {meta.readingMinutes} phút đọc
            </Text>
            {meta.tags.length > 0 && (
              <ul className="flex flex-wrap gap-1.5" aria-label="Chủ đề">
                {meta.tags.map((tag) => (
                  <li key={tag.slug}>
                    <Link href={`/articles?tag=${tag.slug}`}>
                      <Badge size="sm">{tag.name}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </header>

      {loadError && <Alert variant="danger">{loadError}</Alert>}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="flex min-w-0 flex-col gap-8">
          <div className="lg:hidden">
            <TableOfContents items={toc} />
          </div>
          {full ? (
            <ArticleBody html={full.contentHtml} />
          ) : (
            <GatedOverlay
              signInHref={loginHref(pathname)}
              reason={
                loadError ? "UNKNOWN" : isLoading ? "CHECKING" : gateReason
              }
              previewHtml={preview?.previewHtml}
              excerpt={result.kind === "locked" ? result.article.excerpt : null}
            />
          )}

          {articleId && (
            <ReactionBar
              engagement={engagement}
              title={title}
              onReact={toggleReaction}
              onToggleBookmark={toggleBookmark}
            />
          )}
          {error && <Alert variant="danger">{error}</Alert>}

          {meta?.series && (
            <SeriesNav series={meta.series} currentSlug={slug} />
          )}
          {articleId && <CommentThread articleId={articleId} />}
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-[calc(var(--app-header-height,4rem)+1.5rem)] max-h-[calc(100dvh-var(--app-header-height,4rem)-3rem)] overflow-y-auto pr-2 pb-2">
            <TableOfContents items={toc} />
          </div>
        </aside>
      </div>

      {meta && meta.related.length > 0 && (
        <section
          aria-labelledby="related-title"
          className="flex flex-col gap-4"
        >
          <Text
            as="h2"
            id="related-title"
            size="heading-md"
            weight="bold"
            className="font-display"
          >
            Bài viết liên quan
          </Text>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {meta.related.map((article: ArticleCardData) => (
              <li key={article.id}>
                <ArticleCard article={article} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
