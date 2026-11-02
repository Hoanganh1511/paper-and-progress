"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AuthSplash } from "../components/AuthSplash";
import { loginHref } from "../authRedirect";
import { useAuth } from "../hooks";

export interface AuthGateProps {
  children: ReactNode;
  /** Where signed-out visitors go. */
  signInHref?: string;
}

/**
 * Shows the splash while the first session check runs, the children once the
 * user is signed in, and sends everyone else to the sign-in page.
 */
export function AuthGate({ children, signInHref = "/login" }: AuthGateProps) {
  const { status, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status !== "unauthenticated") return;
    // Remember where they were, so signing in brings them back (not for the home page).
    const here = pathname + window.location.search;
    router.replace(
      pathname && pathname !== "/" && signInHref === "/login"
        ? loginHref(here)
        : signInHref,
    );
  }, [status, router, signInHref, pathname]);

  // The expired dialog sits on top of the page the user was working on.
  if (isAuthenticated || status === "expired") return children;
  return <AuthSplash />;
}
