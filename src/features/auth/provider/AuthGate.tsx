"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AuthSplash } from "../components/AuthSplash";
import { useAuth } from "./AuthProvider";

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
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.replace(signInHref);
  }, [status, router, signInHref]);

  // The expired dialog sits on top of the page the user was working on.
  if (status === "authenticated" || status === "expired") return children;
  return <AuthSplash />;
}
