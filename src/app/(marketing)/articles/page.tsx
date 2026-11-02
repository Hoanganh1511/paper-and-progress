import type { Metadata } from "next";
import { Suspense } from "react";
import { PageContainer, PageHeader, Skeleton } from "@/design-system";
import {
  ArticleFilters,
  ArticleList,
  fetchArticleList,
  fetchSeries,
  fetchTags,
} from "@/features/articles";

export const metadata: Metadata = {
  title: "Bài viết - Paper & Progress",
  description:
    "Các bài viết về học tập, lập trình và tiến bộ mỗi ngày. Lọc theo chủ đề hoặc series.",
  alternates: { canonical: "/articles" },
};

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

async function ArticlesContent({
  searchParams,
}: {
  searchParams: PageProps<"/articles">["searchParams"];
}) {
  const params = await searchParams;
  const query = {
    tag: first(params.tag),
    series: first(params.series),
    q: first(params.q),
  };
  const [list, tags, series] = await Promise.all([
    fetchArticleList(query),
    fetchTags(),
    fetchSeries(),
  ]);
  return (
    <>
      <ArticleFilters tags={tags} series={series} active={query} />
      {/* A new key per filter, so "load more" state never leaks between filters. */}
      <ArticleList key={JSON.stringify(query)} initial={list} query={query} />
    </>
  );
}

export default function ArticlesPage({ searchParams }: PageProps<"/articles">) {
  return (
    <main id="main-content" tabIndex={-1} lang="vi" className="outline-none">
      <PageContainer size="wide" spacing="spacious">
        <div className="flex flex-col gap-8">
          <PageHeader
            title="Bài viết"
            description="Ghi chép về học tập, lập trình và những gì mình học được mỗi ngày."
            breadcrumbs={[
              { label: "Trang chủ", href: "/" },
              { label: "Bài viết" },
            ]}
            breadcrumbsProps={{ label: "Đường dẫn" }}
          />
          <Suspense
            fallback={
              <div aria-busy="true" className="flex flex-col gap-4">
                <span role="status" className="sr-only">
                  Đang tải
                </span>
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            }
          >
            <ArticlesContent searchParams={searchParams} />
          </Suspense>
        </div>
      </PageContainer>
    </main>
  );
}
