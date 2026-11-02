import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/design-system";
import { OrderHistory } from "@/features/membership";

export const metadata: Metadata = {
  title: "Lịch sử giao dịch - Paper & Progress",
  description: "Các đơn đăng ký hội viên của bạn và trạng thái từng đơn.",
  robots: { index: false },
};

export default function MembershipOrdersPage() {
  return (
    <main id="main-content" tabIndex={-1} lang="vi" className="outline-none">
      <PageContainer size="wide" spacing="spacious">
        <div className="flex flex-col gap-8">
          <PageHeader
            title="Lịch sử giao dịch"
            description="Các đơn đăng ký hội viên của bạn."
            breadcrumbs={[
              { label: "Trang chủ", href: "/" },
              { label: "Hội viên", href: "/membership" },
              { label: "Lịch sử giao dịch" },
            ]}
            breadcrumbsProps={{ label: "Đường dẫn" }}
          />
          <OrderHistory />
        </div>
      </PageContainer>
    </main>
  );
}
