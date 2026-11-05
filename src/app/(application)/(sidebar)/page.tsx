import { Suspense } from "react";
import type { Metadata } from "next";
import {
  LatestArticlesSection,
  LatestArticlesSkeleton,
  StudySeriesCard,
  TimelineCard,
} from "@/features/home";

export const metadata: Metadata = {
  title: "Trang chủ - Paper & Progress",
  description:
    "Chọn mô-đun, đọc bài viết mới nhất, theo dõi nhật ký trong ngày, mục tiêu và tài nguyên của bạn trong một màn hình.",
};

export default function HomePage() {
  return (
    <>
      <h1 className="sr-only">Trang chủ</h1>
      {/* The sidebar is in the group's layout. From `lg` the cards and, in a
          column of their own, the day's log; below `lg` the log comes first. */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_24rem]">
        <TimelineCard
          className="max-lg:order-1 lg:sticky lg:top-[calc(var(--app-header-height,0px)+1.5rem)] lg:order-2 lg:h-[min(80dvh,calc(100dvh-var(--app-header-height,0px)-3rem))] lg:self-start"
        />
        <div className="grid items-start gap-6 max-lg:order-2 md:grid-cols-2 lg:order-1 lg:grid-cols-1 xl:grid-cols-2">
          {/* Streams in on its own: the other cards do not wait for the articles. */}
          <Suspense
            fallback={<LatestArticlesSkeleton className="col-span-full" />}
          >
            <LatestArticlesSection className="col-span-full" />
          </Suspense>
          <StudySeriesCard className="col-span-full" />
        </div>
      </div>
    </>
  );
}
