import { PageHeader } from "@/design-system";
import { MyArticles } from "@/features/articles/editor/MyArticles";

export default function WritePage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Bài viết của tôi"
        description="Viết, sửa và xuất bản bài viết."
        breadcrumbs={[{ label: "Trang chủ", href: "/" }, { label: "Viết bài" }]}
        breadcrumbsProps={{ label: "Đường dẫn" }}
      />
      <MyArticles />
    </div>
  );
}
