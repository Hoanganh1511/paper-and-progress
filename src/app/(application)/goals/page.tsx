import type { Metadata } from "next";
import Link from "next/link";
import { BookOpenText, GraduationCap, Laptop } from "lucide-react";
import {
  Card,
  PageContainer,
  PageHeader,
  Text,
  cn,
  focusRingClasses,
} from "@/design-system";

export const metadata: Metadata = {
  title: "Mục tiêu của tôi - Paper & Progress",
  description:
    "Các mục tiêu học tập của bạn: tiếng Anh, công nghệ thông tin và nhật ký học mỗi ngày.",
};

const GOALS = [
  {
    href: "/goals/english",
    title: "Tiếng Anh",
    description:
      "Lịch học theo ngày, chuỗi ngày liên tiếp và các hoạt động đã làm.",
    icon: GraduationCap,
  },
  {
    href: "/goals/english/diary",
    title: "English Logs",
    description:
      "Lưu lại những gì bạn đã học mỗi ngày và xem lại quá trình luyện tập.",
    icon: BookOpenText,
  },
  {
    href: "/goals/tech",
    title: "Công nghệ thông tin",
    description:
      "Các nhóm kiến thức Frontend, Backend, DevOps, Mobile, Dữ liệu và AI.",
    icon: Laptop,
  },
] as const;

export default function GoalsPage() {
  return (
    <main id="main-content" tabIndex={-1} lang="vi" className="outline-none">
      <PageContainer size="wide" spacing="spacious">
        <div className="flex flex-col gap-8">
          <PageHeader
            title="Mục tiêu của tôi"
            description="Chọn một mục tiêu để tiếp tục việc học của bạn."
            breadcrumbs={[
              { label: "Trang chủ", href: "/" },
              { label: "Mục tiêu của tôi" },
            ]}
            breadcrumbsProps={{ label: "Đường dẫn" }}
          />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {GOALS.map(({ href, title, description, icon: Icon }) => (
              <li key={href}>
                <Card padding="compact" interactive className="relative h-full">
                  <Icon aria-hidden="true" size={20} />
                  <Text as="h2" size="heading-sm" weight="semibold">
                    <Link
                      href={href}
                      className={cn(
                        "rounded-sharp after:absolute after:inset-0 after:content-['']",
                        focusRingClasses,
                      )}
                    >
                      {title}
                    </Link>
                  </Text>
                  <Text size="body-sm" color="secondary">
                    {description}
                  </Text>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      </PageContainer>
    </main>
  );
}
