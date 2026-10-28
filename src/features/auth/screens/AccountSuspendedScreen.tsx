"use client";

import { AccountSuspended } from "../components/AccountSuspended";
import { useAuth } from "../hooks";

/** `/account-suspended`: the only action is to sign out. */
export function AccountSuspendedScreen() {
  const { logout } = useAuth();
  return <AccountSuspended onLogout={logout} />;
}
