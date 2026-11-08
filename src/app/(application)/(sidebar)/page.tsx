import { Suspense } from "react";
import type { Metadata } from "next";
import {
  LatestArticlesSection,
  LatestArticlesSkeleton,
  StudySeriesCard,
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
      {/* The sidebar is in the group's layout; the content fills the rest.
          The day's log (TimelineCard) is hidden for now. */}
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6">
        {/* Streams in on its own: the other cards do not wait for the articles. */}
        <Suspense fallback={<LatestArticlesSkeleton />}>
          <LatestArticlesSection />
        </Suspense>
        <StudySeriesCard />
      </div>
    </>
  );
}
