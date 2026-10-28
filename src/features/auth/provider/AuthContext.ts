"use client";

import { createContext } from "react";
import type { User } from "../authApi";

/**
 * - `authenticating`: the first session check has not finished yet
 * - `expired`: a session existed and could no longer be refreshed
 * - `suspended`: the backend reported the account as locked
 */
export type AuthStatus =
  | "authenticating"
  | "authenticated"
  | "unauthenticated"
  | "expired"
  | "suspended";

export type LoginOutcome =
  | { status: "authenticated" }
  /** 2FA is on: send the user to `/mfa-challenge` with this ticket. */
  | { status: "mfa_required"; mfaToken: string };

export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  /** True while the session is being restored on first load. */
  isLoading: boolean;
  status: AuthStatus;
  /** Signs in. Throws `AuthApiError` when the backend rejects the attempt. */
  login: (values: {
    email: string;
    password: string;
    rememberMe?: boolean;
  }) => Promise<LoginOutcome>;
  /** Creates the account. It does not sign in: the email must be verified first. */
  register: (values: {
    name: string;
    email: string;
    password: string;
  }) => Promise<void>;
  /** Completes a sign-in that asked for 2FA. */
  verifyMfa: (values: {
    mfaToken: string;
    code: string;
    isBackupCode: boolean;
  }) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
