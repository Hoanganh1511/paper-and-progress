import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/design-system";
import { SavedArticles } from "@/features/articles/components/SavedArticles";

export const metadata: Metadata = {
  title: "Bài viết đã lưu - Paper & Progress",
  robots: { index: false },
};

export default function SavedArticlesPage() {
  return (
    <main id="main-content" tabIndex={-1} lang="vi" className="outline-none">
      <PageContainer size="wide" spacing="spacious">
        <div className="flex flex-col gap-8">
          <PageHeader
            title="Bài viết đã lưu"
            description="Những bài bạn đã bấm “Lưu bài” để đọc sau."
            breadcrumbs={[
              { label: "Trang chủ", href: "/" },
              { label: "Thư viện kiến thức", href: "/learn" },
              { label: "Đã lưu" },
            ]}
            breadcrumbsProps={{ label: "Đường dẫn" }}
          />
          <SavedArticles />
        </div>
      </PageContainer>
    </main>
  );
}
