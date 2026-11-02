"use client";

import { AppHeader, type AppHeaderProps } from "@/features/header";
import { useAuth } from "../hooks";

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

  const common = { articlesHref: "/articles" };

  if (!isAuthenticated || !user) {
    // Also while the first session check runs: until a session is confirmed
    // the visitor is shown as signed out, never as a nameless avatar.
    return <AppHeader {...common} {...props} isSignedOut />;
  }

  const isAdmin = user.role === "ADMIN";
  const canWrite = isAdmin || user.role === "CREATOR";

  return (
    <AppHeader
      {...common}
      {...props}
      score={score}
      profileBadge={profileBadge}
      user={{ name: user.name || user.email, email: user.email }}
      onLogout={logout}
      adminHref={isAdmin ? "/admin" : undefined}
      savedArticlesHref="/articles/saved"
      // Writing is for authors and admins only.
      writeHref={canWrite ? "/write" : undefined}
      // The project dashboard is for admins only; for anyone else there is no button.
      projectStatusHref={isAdmin ? "/dashboard" : undefined}
    />
  );
}
