import type { Metadata } from "next";
import { PageHeader } from "@/design-system";
import { CertificateScreen } from "@/features/certificates";

export const metadata: Metadata = {
  title: "Chỉnh sửa chứng chỉ - Paper & Progress",
};

export default async function EditCertificatePage({
  params,
}: PageProps<"/certificates/[id]/edit">) {
  const { id } = await params;
  return (
    <div lang="vi" className="flex flex-col gap-8">
      <PageHeader
        title="Chỉnh sửa chứng chỉ"
        breadcrumbs={[
          { label: "Trang chủ", href: "/" },
          { label: "Chứng chỉ", href: "/certificates" },
          { label: "Chi tiết", href: `/certificates/${id}` },
          { label: "Chỉnh sửa" },
        ]}
        breadcrumbsProps={{ label: "Đường dẫn" }}
      />
      <CertificateScreen id={id} isEditing />
    </div>
  );
}
