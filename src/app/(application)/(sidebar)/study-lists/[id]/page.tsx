import type { Metadata } from "next";
import { PageHeader } from "@/design-system";
import { StudyListScreen } from "@/features/study-lists";

export const metadata: Metadata = {
  title: "Series học - Paper & Progress",
};

export default async function StudyListPage({
  params,
}: PageProps<"/study-lists/[id]">) {
  const { id } = await params;
  return (
    <div lang="vi" className="flex flex-col gap-8">
      <PageHeader
        title="Series học"
        breadcrumbs={[
          { label: "Trang chủ", href: "/" },
          { label: "Thư viện kiến thức", href: "/learn" },
          { label: "Series học", href: "/learn?tab=lists" },
          { label: "Chi tiết" },
        ]}
        breadcrumbsProps={{ label: "Đường dẫn" }}
      />
      <StudyListScreen id={id} />
    </div>
  );
}
