import type { Metadata } from "next";
import { Suspense } from "react";
import { PageContainer, PageHeader, Skeleton, Text } from "@/design-system";
import { LearningSearch } from "@/features/learning";
import {
  MIN_QUERY_LENGTH,
  SearchResultsView,
  fetchSearch,
} from "@/features/search";

export const metadata: Metadata = {
  title: "Tìm kiếm - Paper & Progress",
  robots: { index: false },
};

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

async function SearchContent({
  searchParams,
}: {
  searchParams: PageProps<"/search">["searchParams"];
}) {
  const q = (first((await searchParams).q) ?? "").trim();
  if (q.length < MIN_QUERY_LENGTH) {
    return (
      <Text color="secondary" role="status">
        Nhập ít nhất {MIN_QUERY_LENGTH} ký tự để tìm chủ đề, tài liệu, bài viết
        và lộ trình.
      </Text>
    );
  }
  return <SearchResultsView results={await fetchSearch(q)} />;
}

export default async function SearchPage({
  searchParams,
}: PageProps<"/search">) {
  const q = first((await searchParams).q) ?? "";
  return (
    <main id="main-content" tabIndex={-1} lang="vi" className="outline-none">
      <PageContainer size="wide" spacing="spacious">
        <div className="flex flex-col gap-8">
          <LearningSearch query={q} />
          <PageHeader
            title="Tìm kiếm"
            description="Kết quả được chia theo chủ đề, tài liệu, bài viết và lộ trình."
            breadcrumbs={[
              { label: "Trang chủ", href: "/" },
              { label: "Tìm kiếm" },
            ]}
            breadcrumbsProps={{ label: "Đường dẫn" }}
          />
          <Suspense
            key={q}
            fallback={
              <div aria-busy="true">
                <span role="status" className="sr-only">
                  Đang tìm
                </span>
                <Skeleton className="h-64 w-full" />
              </div>
            }
          >
            <SearchContent searchParams={searchParams} />
          </Suspense>
        </div>
      </PageContainer>
    </main>
  );
}
