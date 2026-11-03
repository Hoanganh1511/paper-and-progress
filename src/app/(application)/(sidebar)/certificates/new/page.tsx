import type { Metadata } from "next";
import { PageHeader } from "@/design-system";
import { AddCertificateFlow } from "@/features/certificates";

export const metadata: Metadata = {
  title: "Thêm chứng chỉ - Paper & Progress",
};

export default function NewCertificatePage() {
  return (
    <div lang="vi" className="flex flex-col gap-8">
      <PageHeader
        title="Thêm chứng chỉ"
        breadcrumbs={[
          { label: "Trang chủ", href: "/" },
          { label: "Chứng chỉ", href: "/certificates" },
          { label: "Thêm chứng chỉ" },
        ]}
        breadcrumbsProps={{ label: "Đường dẫn" }}
      />
      <AddCertificateFlow />
    </div>
  );
}
