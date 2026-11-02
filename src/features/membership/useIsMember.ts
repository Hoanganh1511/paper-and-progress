"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth";
import { getMyMembership } from "./membershipApi";

/**
 * Whether the reader is a member now: `true` or `false`, or `undefined` while
 * that is not known yet (the session is being restored, or the server has not
 * answered, or it could not be read). A guest is simply `false`.
 */
export function useIsMember(): boolean | undefined {
  const { isAuthenticated, isLoading } = useAuth();
  const [isMember, setIsMember] = useState<boolean>();

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    let isCurrent = true;
    getMyMembership()
      .then((status) => isCurrent && setIsMember(status.isMember))
      .catch(() => undefined);
    return () => {
      isCurrent = false;
    };
  }, [isAuthenticated, isLoading]);

  if (isLoading) return undefined;
  return isAuthenticated ? isMember : false;
}
