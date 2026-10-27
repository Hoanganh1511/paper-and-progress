import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/design-system";
import { BookmarkManager, getBookmarkLibrary } from "@/features/bookmarks";

export const metadata: Metadata = {
  title: "Bookmark - Paper & Progress",
  description:
    "Quản lý các bài học đã lưu: sắp xếp vào thư mục, lọc theo lĩnh vực, level và tiến độ, rồi quay lại học tiếp.",
};

export default async function BookmarksPage() {
  const library = await getBookmarkLibrary();

  return (
    <main id="main-content" tabIndex={-1} lang="vi" className="outline-none">
      <PageContainer size="wide" spacing="spacious">
        <div className="flex flex-col gap-8">
          <PageHeader
            title="Bookmark"
            description="Các bài học bạn đã lưu. Kéo vào thư mục để sắp xếp, hoặc lọc để tìm đúng bài cần học tiếp."
            breadcrumbs={[
              { label: "Trang chủ", href: "/" },
              { label: "Bookmark" },
            ]}
            breadcrumbsProps={{ label: "Đường dẫn" }}
          />
          <BookmarkManager library={library} />
        </div>
      </PageContainer>
    </main>
  );
}
