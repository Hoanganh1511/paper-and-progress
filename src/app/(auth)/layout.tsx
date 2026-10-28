import { Suspense } from "react";
import { Card, PageContainer } from "@/design-system";
import { AuthSplash } from "@/features/auth";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main id="main-content" tabIndex={-1} lang="vi" className="outline-none">
      <PageContainer size="narrow" spacing="spacious">
        <Card className="mx-auto w-full max-w-md" padding="default">
          {/* The screens read the URL (?token, ?email), which needs a boundary. */}
          <Suspense fallback={<AuthSplash label="Đang tải…" />}>
            {children}
          </Suspense>
        </Card>
      </PageContainer>
    </main>
  );
}
