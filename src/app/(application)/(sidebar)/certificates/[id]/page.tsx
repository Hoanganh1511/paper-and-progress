import type { Metadata } from "next";
import { PageHeader } from "@/design-system";
import { CertificateScreen } from "@/features/certificates";

export const metadata: Metadata = {
  title: "Chi tiết chứng chỉ - Paper & Progress",
};

export default async function CertificatePage({
  params,
}: PageProps<"/certificates/[id]">) {
  const { id } = await params;
  return (
    <div lang="vi" className="flex flex-col gap-8">
      <PageHeader
        title="Chi tiết chứng chỉ"
        breadcrumbs={[
          { label: "Trang chủ", href: "/" },
          { label: "Chứng chỉ", href: "/certificates" },
          { label: "Chi tiết" },
        ]}
        breadcrumbsProps={{ label: "Đường dẫn" }}
      />
      <CertificateScreen id={id} />
    </div>
  );
}
