"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AuthSplash } from "../components/AuthSplash";
import { peekNext } from "../authRedirect";
import { useAuth } from "../hooks";

export interface GuestGateProps {
  children: ReactNode;
  /** Where signed-in visitors go. */
  homeHref?: string;
  /** Paths a signed-in visitor may still open, e.g. the suspended-account page. */
  allowedPaths?: string[];
}

/**
 * For the auth pages: signed-in visitors are sent to the app instead of
 * seeing the sign-in form again.
 */
export function GuestGate({
  children,
  homeHref = "/",
  allowedPaths = [],
}: GuestGateProps) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const shouldRedirect = isAuthenticated && !allowedPaths.includes(pathname);

  useEffect(() => {
    // Back to the page that asked for the sign-in, when there was one.
    if (shouldRedirect) router.replace(peekNext(homeHref));
  }, [shouldRedirect, router, homeHref]);

  // The forms show right away; only a confirmed session replaces them.
  return shouldRedirect ? <AuthSplash /> : children;
}
