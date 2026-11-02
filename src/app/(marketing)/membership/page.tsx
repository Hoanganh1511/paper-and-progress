import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/design-system";
import { MembershipView } from "@/features/membership";

export const metadata: Metadata = {
  title: "Hội viên - Paper & Progress",
  description: "Quyền lợi hội viên và trạng thái hội viên của bạn.",
  robots: { index: false },
};

export default function MembershipPage() {
  return (
    <main id="main-content" tabIndex={-1} lang="vi" className="outline-none">
      <PageContainer size="wide" spacing="spacious">
        <div className="flex flex-col gap-8">
          <PageHeader
            title="Hội viên"
            description="Hội viên đọc được toàn bộ các bài viết giới hạn."
            breadcrumbs={[
              { label: "Trang chủ", href: "/" },
              { label: "Hội viên" },
            ]}
            breadcrumbsProps={{ label: "Đường dẫn" }}
          />
          <MembershipView />
        </div>
      </PageContainer>
    </main>
  );
}
