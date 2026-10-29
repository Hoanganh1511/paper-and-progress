"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@/design-system";
import { SessionExpired } from "../components/SessionExpired";
import {
  clearTokens,
  getMeApi,
  getRefreshToken,
  loginApi,
  logoutApi,
  refreshSession,
  registerApi,
  setSessionHandlers,
  setTokens,
  verifyMfaApi,
  type AuthTokens,
  type User,
} from "../authApi";
import {
  AuthContext,
  type AuthContextValue,
  type AuthStatus,
} from "./AuthContext";

export interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Restores the session from the stored refresh token, owns the signed-in
 * user, and the app-wide session states: the "session expired" dialog and the
 * redirect to the suspended-account page. It never blocks rendering; wrap
 * protected content in `AuthGate` to wait for the restore.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("authenticating");

  useEffect(() => {
    let isActive = true;

    setSessionHandlers({
      onSessionExpired: () => {
        if (!isActive) return;
        setStatus((current) =>
          current === "authenticated" ? "expired" : current,
        );
      },
      onAccountSuspended: () => {
        if (!isActive) return;
        setUser(null);
        setStatus("suspended");
      },
    });

    async function restore() {
      if (!getRefreshToken()) {
        setStatus("unauthenticated");
        return;
      }
      try {
        // The access token lives in memory only, so a reload starts from the refresh token.
        await refreshSession();
        const me = await getMeApi();
        if (isActive) {
          setUser(me);
          setStatus("authenticated");
        }
      } catch {
        // Rejected or backend unreachable: treat the visitor as signed out, not as broken.
        if (isActive) setStatus("unauthenticated");
      }
    }
    void restore();

    return () => {
      isActive = false;
      setSessionHandlers({});
    };
  }, []);

  useEffect(() => {
    if (status === "suspended") router.replace("/account-suspended");
  }, [status, router]);

  const startSession = useCallback(async (tokens: AuthTokens) => {
    // Keep the old refresh token when the backend does not rotate it.
    const refreshToken = tokens.refreshToken ?? getRefreshToken();
    if (!refreshToken) throw new Error("The backend sent no refresh token");
    setTokens(tokens.accessToken, refreshToken);
    try {
      setUser(await getMeApi());
    } catch (error) {
      clearTokens();
      throw error;
    }
    setStatus("authenticated");
  }, []);

  const login = useCallback<AuthContextValue["login"]>(
    async ({ email, password, rememberMe }) => {
      const result = await loginApi(email, password, rememberMe);
      if (result.status === "mfa_required") return result;
      await startSession(result.tokens);
      return { status: "authenticated" };
    },
    [startSession],
  );

  const register = useCallback<AuthContextValue["register"]>(
    async ({ name, email, password }) => {
      await registerApi(name, email, password);
    },
    [],
  );

  const verifyMfa = useCallback<AuthContextValue["verifyMfa"]>(
    async (values) => startSession(await verifyMfaApi(values)),
    [startSession],
  );

  const loginWithTokens = useCallback<AuthContextValue["loginWithTokens"]>(
    (tokens) => startSession(tokens),
    [startSession],
  );

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();
    // Local state is cleared first: signing out must work even if the backend does not answer.
    clearTokens();
    setUser(null);
    setStatus("unauthenticated");
    if (refreshToken) await logoutApi(refreshToken).catch(() => undefined);
    router.replace("/login");
  }, [router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: status === "authenticated",
      isLoading: status === "authenticating",
      status,
      login,
      register,
      verifyMfa,
      loginWithTokens,
      logout,
    }),
    [user, status, login, register, verifyMfa, loginWithTokens, logout],
  );

  return (
    <AuthContext value={value}>
      {children}
      <Dialog
        open={status === "expired"}
        onClose={() => {}}
        isDismissible={false}
        size="sm"
        aria-label="Phiên đăng nhập hết hạn"
      >
        <SessionExpired
          titleAs="h2"
          title="Phiên đăng nhập đã hết hạn"
          description="Phiên đăng nhập hết hạn, vui lòng đăng nhập lại."
          signInLabel="Đăng nhập lại"
          onSignIn={() => {
            setUser(null);
            setStatus("unauthenticated");
            router.push("/login");
          }}
        />
      </Dialog>
    </AuthContext>
  );
}
