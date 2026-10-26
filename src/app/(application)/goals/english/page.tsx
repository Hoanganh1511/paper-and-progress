import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/design-system";
import { EnglishGoals, getEnglishTabs } from "@/features/english";

export const metadata: Metadata = {
  title: "Mục tiêu học tiếng Anh - Paper & Progress",
  description:
    "Chọn mục tiêu học tiếng Anh của bạn: luyện thi chứng chỉ, bốn kỹ năng, giao tiếp, từ vựng và ngữ pháp.",
};

export default async function EnglishGoalsPage() {
  const tabs = await getEnglishTabs();

  return (
    <main id="main-content" tabIndex={-1} lang="vi" className="outline-none">
      <PageContainer size="wide" spacing="spacious">
        <div className="flex flex-col gap-8">
          <PageHeader
            title="Mục tiêu học tiếng Anh"
            description="Chọn nhóm mục tiêu, rồi lướt qua các thẻ để tìm lộ trình hợp với bạn."
            breadcrumbs={[
              { label: "Mục tiêu", href: "/goals" },
              { label: "Tiếng Anh" },
            ]}
            breadcrumbsProps={{ label: "Đường dẫn" }}
          />
          <EnglishGoals tabs={tabs} />
        </div>
      </PageContainer>
    </main>
  );
}
