import { Suspense } from "react";
import type { Metadata } from "next";
import { Breadcrumbs, Text } from "@/design-system";
import { DevlogBrowser, getDevlogEntries } from "@/features/devlog";

export const metadata: Metadata = {
  title: "Devlog - Paper & Progress",
  description:
    "Nhật ký phát triển Paper & Progress: từng cập nhật, tiến độ theo module và những gì sắp làm.",
  alternates: {
    types: { "application/rss+xml": "/devlog/feed.xml" },
  },
};

/**
 * One screen, full width: the page is exactly as tall as the window below the
 * sticky header and never scrolls itself. The areas inside scroll on their own.
 */
export default async function DevlogPage() {
  const entries = await getDevlogEntries();

  return (
    <main
      id="main-content"
      tabIndex={-1}
      lang="vi"
      className="flex h-[calc(100dvh-var(--app-header-height,4rem))] flex-col gap-3 overflow-hidden px-4 py-3 outline-none sm:px-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div className="flex flex-wrap items-baseline gap-x-3">
          <Text as="h1" size="heading-md" weight="semibold">
            Devlog
          </Text>
          <Text
            as="p"
            size="body-sm"
            color="secondary"
            className="hidden sm:block"
          >
            Mỗi cập nhật là một entry, mới nhất ở trên.
          </Text>
        </div>
        <Breadcrumbs
          label="Đường dẫn"
          items={[{ label: "Trang chủ", href: "/" }, { label: "Devlog" }]}
        />
      </div>
      <div className="min-h-0 flex-1">
        {/* DevlogBrowser reads ?entry from the URL, which needs a boundary. */}
        <Suspense>
          <DevlogBrowser entries={entries} />
        </Suspense>
      </div>
    </main>
  );
}
