"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

export interface HideOnRoutesProps {
  /** Routes (and everything under them) where the children are not rendered. */
  paths: string[];
  children: ReactNode;
}

/** Leaves its children out on some routes, e.g. the footer on pages that fill one screen. */
export function HideOnRoutes({ paths, children }: HideOnRoutesProps) {
  const pathname = usePathname();
  const isHidden = paths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
  return isHidden ? null : children;
}
