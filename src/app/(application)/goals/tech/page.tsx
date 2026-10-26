import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/design-system";
import { TechHub, getTechGroups } from "@/features/tech";

export const metadata: Metadata = {
  title: "Công nghệ thông tin - Paper & Progress",
  description:
    "Khám phá các nhóm kiến thức công nghệ thông tin: Frontend, Backend, DevOps, Mobile, Dữ liệu và AI, Bảo mật, Cloud và Kiểm thử.",
};

export default async function TechGoalsPage() {
  const groups = await getTechGroups();

  return (
    <main id="main-content" tabIndex={-1} lang="vi" className="outline-none">
      <PageContainer size="wide" spacing="spacious">
        <div className="flex flex-col gap-8">
          <PageHeader
            title="Công nghệ thông tin"
            description="Chọn một nhóm kiến thức, rồi chuyển qua từng phân loại để xem các chủ đề bên trong."
            breadcrumbs={[
              { label: "Mục tiêu", href: "/goals" },
              { label: "Công nghệ thông tin" },
            ]}
            breadcrumbsProps={{ label: "Đường dẫn" }}
          />
          <TechHub groups={groups} />
        </div>
      </PageContainer>
    </main>
  );
}
