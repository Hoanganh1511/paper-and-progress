import type { Metadata } from "next";
import { PageHeader } from "@/design-system";
import { CertificatesDashboard } from "@/features/certificates";

export const metadata: Metadata = {
  title: "Chứng chỉ - Paper & Progress",
  description:
    "Quản lý, theo dõi và lưu trữ các chứng chỉ, bằng cấp và chứng nhận của bạn.",
};

export default function CertificatesPage() {
  return (
    <div lang="vi" className="flex flex-col gap-8">
      <PageHeader
        title="Chứng chỉ"
        description="Quản lý, theo dõi và lưu trữ các chứng chỉ, bằng cấp và chứng nhận của bạn."
        breadcrumbs={[
          { label: "Trang chủ", href: "/" },
          { label: "Chứng chỉ" },
        ]}
        breadcrumbsProps={{ label: "Đường dẫn" }}
      />
      <CertificatesDashboard />
    </div>
  );
}
