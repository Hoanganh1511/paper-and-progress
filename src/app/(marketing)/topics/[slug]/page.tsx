import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageContainer, PageHeader, Skeleton } from "@/design-system";
import { TopicView, fetchTopic } from "@/features/knowledge";

export async function generateMetadata({
  params,
}: PageProps<"/topics/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const detail = await fetchTopic(slug);
  if (!detail) {
    return { title: "Không tìm thấy chủ đề", robots: { index: false } };
  }
  return {
    title: `${detail.topic.name} - Paper & Progress`,
    description: detail.topic.description ?? undefined,
    alternates: { canonical: `/topics/${slug}` },
  };
}

async function TopicContent({
  params,
}: {
  params: PageProps<"/topics/[slug]">["params"];
}) {
  const { slug } = await params;
  const detail = await fetchTopic(slug);
  if (!detail) notFound();
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={detail.topic.name}
        breadcrumbs={[
          { label: "Học tập", href: "/learn" },
          ...detail.breadcrumb.map((crumb) => ({ label: crumb.name })),
          { label: detail.topic.name },
        ]}
        breadcrumbsProps={{ label: "Đường dẫn" }}
      />
      <TopicView initial={detail} />
    </div>
  );
}

export default function TopicPage({ params }: PageProps<"/topics/[slug]">) {
  return (
    <main id="main-content" tabIndex={-1} lang="vi" className="outline-none">
      <PageContainer size="wide" spacing="spacious">
        <Suspense
          fallback={
            <div aria-busy="true" className="flex flex-col gap-4">
              <span role="status" className="sr-only">
                Đang tải chủ đề
              </span>
              <Skeleton className="h-10 w-2/3" />
              <Skeleton className="h-96 w-full" />
            </div>
          }
        >
          <TopicContent params={params} />
        </Suspense>
      </PageContainer>
    </main>
  );
}
