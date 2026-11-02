import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageContainer, Skeleton } from "@/design-system";
import {
  ArticleReader,
  articleJsonLd,
  fetchArticle,
  JsonLd,
} from "@/features/articles";

export async function generateMetadata({
  params,
}: PageProps<"/articles/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const result = await fetchArticle(slug);
  if (result.kind === "not-found") {
    return { title: "Không tìm thấy bài viết", robots: { index: false } };
  }
  const { article } = result;
  const title = `${article.title} - Paper & Progress`;
  // Members-only text is not for search engines; its card (title, excerpt) is.
  const isLocked = result.kind === "locked";
  return {
    title,
    description: article.excerpt ?? undefined,
    alternates: { canonical: `/articles/${slug}` },
    robots: isLocked ? { index: false, follow: true } : undefined,
    openGraph: {
      type: "article",
      title: article.title,
      description: article.excerpt ?? undefined,
      url: `/articles/${slug}`,
      ...(result.kind !== "locked" && result.article.publishedAt
        ? { publishedTime: result.article.publishedAt }
        : {}),
    },
    twitter: { card: "summary_large_image", title: article.title },
  };
}

async function ArticleContent({
  params,
}: {
  params: PageProps<"/articles/[slug]">["params"];
}) {
  const { slug } = await params;
  const result = await fetchArticle(slug);
  if (result.kind === "not-found") notFound();
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return (
    <>
      <JsonLd
        data={articleJsonLd({ url: `${site}/articles/${slug}`, result })}
      />
      <ArticleReader slug={slug} result={result} />
    </>
  );
}

export default function ArticlePage({ params }: PageProps<"/articles/[slug]">) {
  return (
    <main id="main-content" tabIndex={-1} lang="vi" className="outline-none">
      <PageContainer size="wide" spacing="spacious">
        <Suspense
          fallback={
            <div aria-busy="true" className="flex flex-col gap-4">
              <span role="status" className="sr-only">
                Đang tải bài viết
              </span>
              <Skeleton className="h-10 w-2/3" />
              <Skeleton className="h-96 w-full" />
            </div>
          }
        >
          <ArticleContent params={params} />
        </Suspense>
      </PageContainer>
    </main>
  );
}
