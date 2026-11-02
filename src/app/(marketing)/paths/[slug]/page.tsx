import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageContainer, Skeleton } from "@/design-system";
import { PathOverview, fetchPath } from "@/features/learning-paths";

export async function generateMetadata({
  params,
}: PageProps<"/paths/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const path = await fetchPath(slug);
  if (!path) {
    return { title: "Không tìm thấy lộ trình", robots: { index: false } };
  }
  return {
    title: `${path.title} - Paper & Progress`,
    description: path.description,
    alternates: { canonical: `/paths/${slug}` },
  };
}

async function PathContent({
  params,
}: {
  params: PageProps<"/paths/[slug]">["params"];
}) {
  const { slug } = await params;
  const path = await fetchPath(slug);
  if (!path) notFound();
  return <PathOverview initial={path} />;
}

export default function PathPage({ params }: PageProps<"/paths/[slug]">) {
  return (
    <main id="main-content" tabIndex={-1} lang="vi" className="outline-none">
      <PageContainer size="wide" spacing="spacious">
        <Suspense
          fallback={
            <div aria-busy="true" className="flex flex-col gap-4">
              <span role="status" className="sr-only">
                Đang tải lộ trình
              </span>
              <Skeleton className="h-10 w-2/3" />
              <Skeleton className="h-96 w-full" />
            </div>
          }
        >
          <PathContent params={params} />
        </Suspense>
      </PageContainer>
    </main>
  );
}
