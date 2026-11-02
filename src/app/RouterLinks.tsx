"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { LinkComponentProvider } from "@/design-system";

/**
 * Gives every `LinkButton` below it next/link, so an internal link changes page
 * in the browser instead of loading it again. It is a client file because the
 * root layout, a server component, cannot hand a function down to the provider;
 * here `Link` is imported on the client side, where it is just a component.
 */
export function RouterLinks({ children }: { children: ReactNode }) {
  return (
    <LinkComponentProvider component={Link}>{children}</LinkComponentProvider>
  );
}
