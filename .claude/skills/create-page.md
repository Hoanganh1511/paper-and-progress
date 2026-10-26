---
name: create-page
description: Tạo page mới trong Next.js App Router. Kích hoạt khi user yêu cầu tạo page, tạo route, hoặc add page.
---

# Create Page

## Bước 1 - Xác định route group

- Marketing pages (public): src/app/(marketing)/
- App pages (cần auth): src/app/(application)/

## Bước 2 - Tạo files

```base
mkdir -p src/app/(group)/page-name
```

Tạo 3 files tối thiểu:

- `page.tsx` - Server Component, data fetching, metadata
- `loading.tsx` - Suspense fallback
- `error-tsx` - Error boundary ("use client")

## Bước 3 - page.tsx template

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Title - Paper & Progress",
  description: "Page description for SEO",
};

export default async function PageName() {
  return <main>{/* Compose từ design-system components */}</main>;
}
```

## Bước 4 - error.tsx template

```tsx
"use client";

import { ErrorState } from "@/design-system";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState message={error.message} onRetry={reset} />;
}
```

## Rules

- page.tsx is a Server Component by default
- Interactive parts -> separate to "use client" in features/
- Import UI from design-system/, logic from features/
