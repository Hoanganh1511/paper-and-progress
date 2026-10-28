"use client";

import { AppHeader, type AppHeaderProps } from "@/features/header";
import { getKeycloak } from "../keycloak";
import { useAuth } from "./AuthProvider";

export type SessionHeaderProps = Omit<
  AppHeaderProps,
  "user" | "isSignedOut" | "onLogout"
>;

/**
 * The app header driven by the session: signed-in visitors get their account
 * menu and a logout that ends the Keycloak session; everyone else gets
 * sign-in and sign-up in the avatar menu.
 */
export function SessionHeader({
  score,
  profileBadge,
  ...props
}: SessionHeaderProps) {
  const { status, logout } = useAuth();

  if (status !== "authenticated") {
    return <AppHeader {...props} isSignedOut={status !== "authenticating"} />;
  }

  const claims = getKeycloak().tokenParsed;
  const email = typeof claims?.email === "string" ? claims.email : "";
  const name =
    typeof claims?.name === "string" && claims.name ? claims.name : email;

  return (
    <AppHeader
      {...props}
      score={score}
      profileBadge={profileBadge}
      user={{ name, email }}
      onLogout={logout}
    />
  );
}
