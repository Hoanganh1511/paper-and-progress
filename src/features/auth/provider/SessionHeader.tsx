"use client";

import { useEffect, useState } from "react";
import { AppHeader, type AppHeaderProps } from "@/features/header";
import { api } from "../authApi";
import { useAuth } from "../hooks";

const date = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short" });

interface MembershipNote {
  status: string;
  /** What the membership entry of the account menu offers; none for a member. */
  badge?: string;
  /** Whether the membership is running now. */
  isMember?: boolean;
}

/**
 * What the account menu says about membership. It is `undefined` until the
 * server has answered (and if it fails), so the menu never claims a status it
 * does not know.
 */
function useMembershipNote(isSignedIn: boolean): MembershipNote | undefined {
  const [note, setNote] = useState<MembershipNote>();
  useEffect(() => {
    if (!isSignedIn) return;
    let isCurrent = true;
    api
      .get<{ isMember: boolean; expiresAt: string | null }>("/membership/me")
      .then(({ data }) => {
        if (!isCurrent) return;
        if (data.isMember && data.expiresAt) {
          setNote({
            status: `Hội viên đến ${date.format(new Date(data.expiresAt))}`,
            isMember: true,
          });
        } else if (data.expiresAt) {
          setNote({ status: "Hội viên đã hết hạn", badge: "Gia hạn" });
        } else {
          setNote({ status: "Thành viên miễn phí", badge: "Nâng cấp" });
        }
      })
      .catch(() => undefined);
    return () => {
      isCurrent = false;
    };
  }, [isSignedIn]);
  return isSignedIn ? note : undefined;
}

export type SessionHeaderProps = Omit<
  AppHeaderProps,
  "user" | "isSignedOut" | "onLogout"
>;

/**
 * The app header driven by the session: signed-in visitors get their account
 * menu and a logout that ends the session; everyone else (including while the
 * session is still being restored) gets the sign-in button.
 */
export function SessionHeader({
  score,
  profileBadge,
  ...props
}: SessionHeaderProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const membership = useMembershipNote(isAuthenticated && !!user);

  if (!isAuthenticated || !user) {
    // Also while the first session check runs: until a session is confirmed
    // the visitor is shown as signed out, never as a nameless avatar.
    return <AppHeader {...props} isSignedOut />;
  }

  const isAdmin = user.role === "ADMIN";
  const canWrite = isAdmin || user.role === "CREATOR";

  return (
    <AppHeader
      {...props}
      score={score}
      profileBadge={profileBadge}
      user={{
        name: user.name || user.email,
        email: user.email,
        status: membership?.status,
      }}
      onLogout={logout}
      adminHref={isAdmin ? "/admin" : undefined}
      savedArticlesHref="/articles/saved"
      membershipHref="/membership"
      membershipBadge={membership?.badge}
      isMember={membership?.isMember}
      orderHistoryHref="/membership/orders"
      // Writing is for authors and admins only.
      writeHref={canWrite ? "/write" : undefined}
      // The project dashboard is for admins only; for anyone else there is no button.
      projectStatusHref={isAdmin ? "/dashboard" : undefined}
    />
  );
}
