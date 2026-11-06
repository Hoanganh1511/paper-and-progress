import { Suspense } from "react";
import type { Metadata } from "next";
import { PageContainer } from "@/design-system";
import { WriteFrame } from "@/features/articles/editor/WriteFrame";
import { WriteGate } from "@/features/articles/editor/WriteGate";

export const metadata: Metadata = {
  title: "Viết bài - Paper & Progress",
  robots: { index: false },
};

/** The writing tools: only authors and admins get past the gate. */
export default function WriteLayout({ children }: LayoutProps<"/write">) {
  return (
    <main id="main-content" tabIndex={-1} lang="vi" className="outline-none">
      <Suspense
        fallback={
          <PageContainer size="wide" spacing="spacious">
            <WriteGate>{children}</WriteGate>
          </PageContainer>
        }
      >
        <WriteFrame>
          <WriteGate>{children}</WriteGate>
        </WriteFrame>
      </Suspense>
    </main>
  );
}
