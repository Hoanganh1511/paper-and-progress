import { Suspense } from "react";
import { Card, PageContainer } from "@/design-system";
import { AuthSplash, GuestGate } from "@/features/auth";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      lang="vi"
      className="flex flex-1 flex-col justify-center outline-none"
    >
      <PageContainer size="narrow" spacing="spacious">
        <Card className="mx-auto w-full max-w-md" padding="default">
          {/* The screens read the URL (?token, ?email), which needs a boundary. */}
          <Suspense fallback={<AuthSplash label="Đang tải…" />}>
            <GuestGate allowedPaths={["/account-suspended"]}>
              {children}
            </GuestGate>
          </Suspense>
        </Card>
      </PageContainer>
    </main>
  );
}
