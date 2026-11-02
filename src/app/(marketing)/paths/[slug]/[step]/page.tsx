import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageContainer, Skeleton } from "@/design-system";
import { StepView, fetchStep } from "@/features/learning-paths";

export async function generateMetadata({
  params,
}: PageProps<"/paths/[slug]/[step]">): Promise<Metadata> {
  const { slug, step: stepSlug } = await params;
  const detail = await fetchStep(slug, stepSlug);
  if (!detail) {
    return { title: "Không tìm thấy bước học", robots: { index: false } };
  }
  return {
    title: `${detail.step.title} - ${detail.path.title} - Paper & Progress`,
    description: detail.step.lead,
    alternates: { canonical: `/paths/${slug}/${stepSlug}` },
  };
}

async function StepContent({
  params,
}: {
  params: PageProps<"/paths/[slug]/[step]">["params"];
}) {
  const { slug, step: stepSlug } = await params;
  const detail = await fetchStep(slug, stepSlug);
  if (!detail) notFound();
  return <StepView key={stepSlug} initial={detail} pathSlug={slug} />;
}

export default function StepPage({
  params,
}: PageProps<"/paths/[slug]/[step]">) {
  return (
    <main id="main-content" tabIndex={-1} lang="vi" className="outline-none">
      <PageContainer size="wide" spacing="spacious">
        <Suspense
          fallback={
            <div aria-busy="true" className="flex flex-col gap-4">
              <span role="status" className="sr-only">
                Đang tải bước học
              </span>
              <Skeleton className="h-10 w-2/3" />
              <Skeleton className="h-96 w-full" />
            </div>
          }
        >
          <StepContent params={params} />
        </Suspense>
      </PageContainer>
    </main>
  );
}
