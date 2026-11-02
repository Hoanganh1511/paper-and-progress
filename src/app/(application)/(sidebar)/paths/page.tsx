import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader, Skeleton } from "@/design-system";
import {
  PathCatalog,
  PathFilters,
  fetchPaths,
} from "@/features/learning-paths";

export const metadata: Metadata = {
  title: "Lộ trình học - Paper & Progress",
  description:
    "Các lộ trình học từng bước: làm theo thứ tự, đánh dấu khi xong và ghi lại những gì bạn học được.",
  alternates: { canonical: "/paths" },
};

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

async function PathsContent({
  searchParams,
}: {
  searchParams: PageProps<"/paths">["searchParams"];
}) {
  const params = await searchParams;
  const query = {
    q: first(params.q),
    topic: first(params.topic),
    level: first(params.level),
  };
  const paths = await fetchPaths(query);
  return (
    <>
      <PathFilters active={query} />
      <PathCatalog paths={paths} />
    </>
  );
}

export default function PathsPage({ searchParams }: PageProps<"/paths">) {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Lộ trình học"
        description="Làm từng bước theo thứ tự, đánh dấu khi xong và ghi lại những gì bạn học được."
        breadcrumbs={[
          { label: "Trang chủ", href: "/" },
          { label: "Lộ trình học" },
        ]}
        breadcrumbsProps={{ label: "Đường dẫn" }}
      />
      <Suspense
        fallback={
          <div aria-busy="true" className="flex flex-col gap-4">
            <span role="status" className="sr-only">
              Đang tải
            </span>
            <Skeleton className="h-64 w-full" />
          </div>
        }
      >
        <PathsContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
