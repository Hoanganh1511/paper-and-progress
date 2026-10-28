import type { Metadata } from "next";
import { getBookmarkLibrary } from "@/features/bookmarks";
import {
  DEVLOG_MODULES,
  computePeriodProgress,
  computeProjectSummaries,
  getDevlogEntries,
} from "@/features/devlog";
import {
  GoalsCard,
  HOME_RESOURCES,
  HomeSidebar,
  KnowledgeCard,
  ProjectsCard,
  ResourcesCard,
  TimelineCard,
} from "@/features/home";

export const metadata: Metadata = {
  title: "Trang chủ - Paper & Progress",
  description:
    "Chọn mô-đun, theo dõi nhật ký trong ngày, dự án, kiến thức đã lưu, mục tiêu và tài nguyên của bạn trong một màn hình.",
};

export default async function HomePage() {
  const [entries, library] = await Promise.all([
    getDevlogEntries(),
    getBookmarkLibrary(),
  ]);

  return (
    <main
      id="main-content"
      tabIndex={-1}
      lang="vi"
      className="px-4 py-8 outline-none sm:px-6 md:py-10"
    >
      {/* From `lg`: a sidebar, then the cards in three columns. */}
      <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <HomeSidebar />
        <div className="grid items-start gap-6 md:grid-cols-2 lg:grid-cols-3">
          <TimelineCard entries={entries} />
          <ProjectsCard
            projects={computeProjectSummaries(entries, DEVLOG_MODULES)}
          />
          <KnowledgeCard bookmarks={library.bookmarks} />
          <GoalsCard
            week={computePeriodProgress(entries, 7)}
            month={computePeriodProgress(entries, 30)}
          />
          <ResourcesCard resources={HOME_RESOURCES} />
        </div>
      </div>
    </main>
  );
}
