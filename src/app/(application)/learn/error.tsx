"use client";

import { ErrorState } from "@/design-system";

// In this version of Next.js the recovery callback is `retry` (not `reset`),
// and `error` can be any thrown value.
export default function Error({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <main id="main-content">
      <ErrorState
        titleAs="h1"
        title="Không tải được nội dung học tập"
        message={error instanceof globalThis.Error ? error.message : undefined}
        retryLabel="Thử lại"
        onRetry={retry}
      />
    </main>
  );
}
