import type { Metadata } from "next";
import { Suspense } from "react";
import { PageContainer, PageHeader, Skeleton } from "@/design-system";
import { PathCatalog, fetchPaths } from "@/features/learning-paths";

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
  const paths = await fetchPaths({
    q: first(params.q),
    topic: first(params.topic),
    level: first(params.level),
  });
  return <PathCatalog paths={paths} />;
}

export default function PathsPage({ searchParams }: PageProps<"/paths">) {
  return (
    <main id="main-content" tabIndex={-1} lang="vi" className="outline-none">
      <PageContainer size="wide" spacing="spacious">
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
      </PageContainer>
    </main>
  );
}
