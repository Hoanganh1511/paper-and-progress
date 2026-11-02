import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { Skeleton } from "@/design-system";
import { fetchLearningDomains } from "@/features/knowledge";
import {
  LearningHub,
  LibraryArticlesSection,
  LibraryHero,
} from "@/features/learning";

export const metadata: Metadata = {
  title: "Học tập theo lĩnh vực - Paper & Progress",
  description:
    "Khám phá bài viết mới và các lĩnh vực cần học: công nghệ, tài chính, sức khỏe, ngôn ngữ và kỹ năng mềm. Chọn lĩnh vực, rồi đi qua từng phân loại và chủ đề.",
};

async function LearnContent({
  searchParams,
}: {
  searchParams: PageProps<"/learn">["searchParams"];
}) {
  // The catalogue comes from the API, so it is read per request, not at build time.
  await connection();
  const [domains, params] = await Promise.all([
    fetchLearningDomains(),
    searchParams,
  ]);
  const tab = Array.isArray(params.tab) ? params.tab[0] : params.tab;
  return (
    <LearningHub
      domains={domains}
      // `/learn?tab=techstack` opens on the Techstack tab.
      defaultTab={tab === "techstack" ? "techstack" : "articles"}
      // Its own Suspense: the domains do not wait for the articles.
      articles={
        <Suspense
          fallback={
            <div aria-busy="true">
              <span role="status" className="sr-only">
                Đang tải bài viết
              </span>
              <Skeleton className="h-64 w-full" />
            </div>
          }
        >
          <LibraryArticlesSection />
        </Suspense>
      }
    />
  );
}

/**
 * Beside the sidebar of the group's layout: the hero (title, panda, search)
 * and the library's folder tabs with their panel. The sidebar leads to the
 * other parts of the site, so there is no row of section buttons here. The
 * hero's h1 is the page's only one.
 */
export default function LearnPage({ searchParams }: PageProps<"/learn">) {
  return (
    <div className="flex flex-col gap-4 md:gap-5">
      <LibraryHero />
      <Suspense
        fallback={
          <div aria-busy="true">
            <span role="status" className="sr-only">
              Đang tải
            </span>
            <Skeleton className="h-96 w-full" />
          </div>
        }
      >
        <LearnContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
