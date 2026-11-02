import type { Metadata } from "next";
import { fetchTopicCounts } from "@/features/knowledge";
import { TechHero, TechHub, getTechGroups } from "@/features/tech";

export const metadata: Metadata = {
  title: "Công nghệ thông tin - Paper & Progress",
  description:
    "Khám phá các nhóm kiến thức công nghệ thông tin: Frontend, Backend, DevOps, Mobile, Dữ liệu và AI, Bảo mật, Cloud và Kiểm thử.",
};

/**
 * Beside the sidebar of the group's layout, which has the page's `<main>`: the
 * hero, the bar of groups, and the panel of the chosen one. The counts on each
 * card come from the knowledge base; if it cannot be read they are zeros.
 */
export default async function TechGoalsPage() {
  const [groups, counts] = await Promise.all([
    getTechGroups(),
    fetchTopicCounts(),
  ]);

  return (
    <div className="flex flex-col gap-5 md:gap-6">
      <TechHero
        breadcrumbs={[
          { label: "Mục tiêu của tôi", href: "/goals" },
          { label: "Công nghệ thông tin" },
        ]}
        title="Công nghệ thông tin"
        description="Chọn một nhóm kiến thức, rồi chuyển qua từng phân loại để xem các chủ đề bên trong."
      />
      <TechHub groups={groups} counts={counts} />
    </div>
  );
}
