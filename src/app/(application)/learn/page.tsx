import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { Skeleton } from "@/design-system";
import { fetchLearningDomains } from "@/features/knowledge";
import { LearningHub } from "@/features/learning";

export const metadata: Metadata = {
  title: "Học tập theo lĩnh vực - Paper & Progress",
  description:
    "Khám phá các lĩnh vực cần học: công nghệ, tài chính, sức khỏe, ngôn ngữ và kỹ năng mềm. Chọn lĩnh vực, rồi đi qua từng phân loại và chủ đề.",
};

async function LearnContent() {
  // The catalogue comes from the API, so it is read per request, not at build time.
  await connection();
  const domains = await fetchLearningDomains();
  return <LearningHub domains={domains} />;
}

export default function LearnPage() {
  return (
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
      <LearnContent />
    </Suspense>
  );
}
