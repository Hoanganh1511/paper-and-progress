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
      {/* From `lg`: the sidebar, the cards, and the day's log in the right-most
          column. Below `lg` the log comes right after the sidebar. */}
      <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)_20rem] xl:grid-cols-[18rem_minmax(0,1fr)_24rem]">
        <HomeSidebar />
        <TimelineCard
          entries={entries}
          className="max-lg:order-2 lg:sticky lg:top-[calc(var(--app-header-height,0px)+1.5rem)] lg:order-3 lg:h-[min(80dvh,calc(100dvh-var(--app-header-height,0px)-3rem))] lg:self-start"
        />
        <div className="grid items-start gap-6 max-lg:order-3 md:grid-cols-2 lg:order-2 lg:grid-cols-1 xl:grid-cols-2">
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
