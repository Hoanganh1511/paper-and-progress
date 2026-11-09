"use client";

import type { ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { PageContainer } from "@/design-system";

// A saved article's own address; `new` is not one.
const EDIT_PATH = /^\/write\/(?!new$)[^/]+$/;

/**
 * The page frame of the writing tools. Two articles side by side (`?with=`)
 * and the editor of a saved article (`/write/<id>`, which has the series
 * column beside it) get the whole width of the page; everything else keeps the
 * usual one.
 */
export function WriteFrame({ children }: { children: ReactNode }) {
  const isSplit = useSearchParams().has("with");
  const isEditing = EDIT_PATH.test(usePathname());
  return (
    <PageContainer
      size={isSplit || isEditing ? "full" : "wide"}
      spacing="spacious"
    >
      {children}
    </PageContainer>
  );
}
