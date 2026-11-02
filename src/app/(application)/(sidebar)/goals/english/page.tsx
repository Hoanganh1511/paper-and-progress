import type { Metadata } from "next";
import { LearningCalendarSection } from "@/features/learning-calendar";

export const metadata: Metadata = {
  title: "Mục tiêu học tiếng Anh - Paper & Progress",
  description:
    "Theo dõi hành trình học tiếng Anh của bạn theo từng ngày: ngày học, chuỗi ngày liên tiếp và các hoạt động đã làm.",
};

/**
 * The English goals page is the learning calendar: one box, with its own title.
 * It sits beside the sidebar of the group's layout, which has the page's `<main>`.
 */
export default function EnglishGoalsPage() {
  return <LearningCalendarSection />;
}
