import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/design-system";
import { StepTutor, getBackendTutorSteps } from "@/features/tutor";

export const metadata: Metadata = {
  title: "Backend Step Tutor - Paper & Progress",
  description:
    "Lộ trình từng bước cho Phase 0 của backend: design system primitives, NestJS với Docker, Postgres và migrations.",
};

export default async function BackendTutorPage() {
  const steps = await getBackendTutorSteps();

  return (
    <main id="main-content" tabIndex={-1} lang="vi" className="outline-none">
      <PageContainer size="wide" spacing="spacious">
        <div className="flex flex-col gap-8">
          <PageHeader
            title="Backend Step Tutor"
            description="Phase 0.1 đến 0.3: primitives, NestJS và Postgres. Làm từng bước, đánh dấu khi xong, ghi chú lại những gì bạn học được."
            breadcrumbs={[
              { label: "Mục tiêu", href: "/goals" },
              { label: "Công nghệ thông tin", href: "/goals/tech" },
              { label: "Backend Step Tutor" },
            ]}
            breadcrumbsProps={{ label: "Đường dẫn" }}
          />
          <StepTutor steps={steps} />
        </div>
      </PageContainer>
    </main>
  );
}
