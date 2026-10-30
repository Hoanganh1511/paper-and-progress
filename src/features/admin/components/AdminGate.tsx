"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth";

export const ADMIN_ROLE = "ADMIN";

export interface AdminGateProps {
  children: ReactNode;
  /** Where everyone who is not an admin goes. */
  fallbackHref?: string;
}

/**
 * Renders the admin area only for an `ADMIN`. The page sits behind the app's
 * sign-in gate, so a user is always present here; anyone else is sent home.
 * The backend still checks the role on every `/admin/*` call.
 */
export function AdminGate({ children, fallbackHref = "/" }: AdminGateProps) {
  const { user } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === ADMIN_ROLE;

  useEffect(() => {
    if (user && !isAdmin) router.replace(fallbackHref);
  }, [user, isAdmin, router, fallbackHref]);

  return isAdmin ? children : null;
}
