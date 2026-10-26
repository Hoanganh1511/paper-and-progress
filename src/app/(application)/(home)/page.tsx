import type { Metadata } from "next";
import { PageContainer } from "@/design-system";
import { LAUNCHER_MODULES, ModuleGrid } from "@/features/launcher";

export const metadata: Metadata = {
  title: "Trang chủ - Paper & Progress",
  description:
    "Mọi mô-đun của Paper & Progress trong một màn hình: mục tiêu, kỹ năng, lộ trình, dự án, khám phá và cộng đồng.",
};

export default function HomePage() {
  return (
    <main id="main-content" tabIndex={-1} className="outline-none">
      <PageContainer size="wide" spacing="spacious">
        <ModuleGrid
          titleAs="h1"
          title="Bạn muốn làm gì hôm nay?"
          description="Chọn một mô-đun để bắt đầu."
          navLabel="Các mô-đun"
          modules={LAUNCHER_MODULES}
          lang="vi"
        />
      </PageContainer>
    </main>
  );
}
