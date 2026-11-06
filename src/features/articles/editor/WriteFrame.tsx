"use client";

import type { ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { PageContainer } from "@/design-system";

/**
 * The page frame of the writing tools. Two articles side by side (`?with=`)
 * get the whole width of the page; everything else keeps the usual one.
 */
export function WriteFrame({ children }: { children: ReactNode }) {
  const isSplit = useSearchParams().has("with");
  return (
    <PageContainer size={isSplit ? "full" : "wide"} spacing="spacious">
      {children}
    </PageContainer>
  );
}
