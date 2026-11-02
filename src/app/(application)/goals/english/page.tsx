import type { Metadata } from "next";
import { PageContainer } from "@/design-system";
import { LearningCalendarSection } from "@/features/learning-calendar";

export const metadata: Metadata = {
  title: "Mục tiêu học tiếng Anh - Paper & Progress",
  description:
    "Theo dõi hành trình học tiếng Anh của bạn theo từng ngày: ngày học, chuỗi ngày liên tiếp và các hoạt động đã làm.",
};

/** The English goals page is the learning calendar: one box, with its own title. */
export default function EnglishGoalsPage() {
  return (
    <main id="main-content" tabIndex={-1} lang="vi" className="outline-none">
      <PageContainer size="wide" spacing="compact" className="md:py-3">
        <LearningCalendarSection />
      </PageContainer>
    </main>
  );
}
