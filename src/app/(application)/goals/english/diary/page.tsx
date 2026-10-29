import type { Metadata } from "next";
import { Breadcrumbs, Text } from "@/design-system";
import { EnglishDiary } from "@/features/english-diary";

export const metadata: Metadata = {
  title: "English Diary - Paper & Progress",
  description:
    "Tự học tiếng Anh: lưu lại những gì bạn đã học mỗi ngày và xem lại quá trình luyện tập.",
};

/** Desktop: one screen below the header, each column scrolls on its own. */
export default function EnglishDiaryPage() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      lang="vi"
      className="flex flex-col gap-3 px-4 py-3 outline-none sm:px-6 lg:h-[calc(100dvh-var(--app-header-height,4rem))] lg:overflow-hidden"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div className="flex flex-wrap items-baseline gap-x-3">
          <Text as="h1" size="heading-md" weight="semibold">
            English Diary
          </Text>
          <Text
            as="p"
            size="body-sm"
            color="secondary"
            className="hidden sm:block"
          >
            Lưu lại những gì bạn đã học mỗi ngày.
          </Text>
        </div>
        <Breadcrumbs
          label="Đường dẫn"
          items={[
            { label: "Trang chủ", href: "/" },
            { label: "Tự học tiếng Anh" },
          ]}
        />
      </div>
      <div className="min-h-0 flex-1">
        <EnglishDiary />
      </div>
    </main>
  );
}
