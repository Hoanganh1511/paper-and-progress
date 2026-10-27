import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/design-system";
import {
  DevlogBrowser,
  computeProjectStatus,
  getDevlogEntries,
} from "@/features/devlog";

export const metadata: Metadata = {
  title: "Devlog - Paper & Progress",
  description:
    "Nhật ký phát triển Paper & Progress: từng cập nhật, tiến độ theo module và những gì sắp làm.",
  alternates: {
    types: { "application/rss+xml": "/devlog/feed.xml" },
  },
};

export default async function DevlogPage() {
  const entries = await getDevlogEntries();
  const status = computeProjectStatus(entries);

  return (
    <main id="main-content" tabIndex={-1} lang="vi" className="outline-none">
      <PageContainer size="wide" spacing="spacious">
        <div className="flex flex-col gap-8">
          <PageHeader
            title="Devlog"
            description="Nhật ký phát triển dự án: mỗi cập nhật là một entry, mới nhất ở trên."
            breadcrumbs={[
              { label: "Trang chủ", href: "/" },
              { label: "Devlog" },
            ]}
            breadcrumbsProps={{ label: "Đường dẫn" }}
          />
          <DevlogBrowser entries={entries} status={status} />
        </div>
      </PageContainer>
    </main>
  );
}
