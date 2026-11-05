import type { Metadata } from "next";
import { PageContainer } from "@/design-system";
import { CV, CvPage } from "@/features/cv";

export const metadata: Metadata = {
  title: `CV - ${CV.name}`,
  description: `${CV.name}, ${CV.role}. ${CV.summary}`,
};

export default function CvRoute() {
  return (
    <main id="main-content" tabIndex={-1} className="outline-none">
      {/* A document, not a dashboard: the reading width, not the wide one. */}
      <PageContainer size="default" spacing="spacious">
        <CvPage />
      </PageContainer>
    </main>
  );
}
