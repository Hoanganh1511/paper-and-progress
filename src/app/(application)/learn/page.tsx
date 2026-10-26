import type { Metadata } from "next";
import { LearningHub, getLearningDomains } from "@/features/learning";

export const metadata: Metadata = {
  title: "Học tập theo lĩnh vực - Paper & Progress",
  description:
    "Khám phá các lĩnh vực cần học: công nghệ, tài chính, sức khỏe, ngôn ngữ và kỹ năng mềm. Chọn lĩnh vực, rồi đi qua từng phân loại và khóa học.",
};

export default async function LearnPage() {
  const domains = await getLearningDomains();

  return <LearningHub domains={domains} />;
}
