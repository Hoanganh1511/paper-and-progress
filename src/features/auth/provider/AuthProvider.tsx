"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@/design-system";
import { SessionExpired } from "../components/SessionExpired";
import { getKeycloak } from "../keycloak";

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

export interface AuthContextValue {
  status: AuthStatus;
  /** Marks the session as expired, e.g. after an API call answered 401. */
  markExpired: () => void;
  /** Marks the account as suspended, e.g. after an API call answered 403 `account_suspended`. */
  markSuspended: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Seconds of token life left below which the token is renewed. */
const MIN_TOKEN_VALIDITY = 30;

// keycloak-js throws when `init` runs twice (React strict mode mounts effects
// twice in development), so every mount shares one initialization.
let initPromise: Promise<boolean> | undefined;

function initKeycloak() {
  initPromise ??= getKeycloak().init({
    onLoad: "check-sso",
    silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
    pkceMethod: "S256",
    checkLoginIframe: false,
  });
  return initPromise;
}

export interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Checks for an existing Keycloak session, renews the token in the
 * background, and owns the app-wide session states: the "session expired"
 * dialog and the redirect to the suspended-account page. It never blocks
 * rendering; wrap protected content in `AuthGate` to wait for the check.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const [status, setStatus] = useState<AuthStatus>("authenticating");

  useEffect(() => {
    let isActive = true;
    const keycloak = getKeycloak();

    initKeycloak()
      .then((isAuthenticated) => {
        if (isActive) {
          setStatus(isAuthenticated ? "authenticated" : "unauthenticated");
        }
      })
      // Keycloak unreachable: treat the visitor as signed out, not as broken.
      .catch(() => isActive && setStatus("unauthenticated"));

    keycloak.onTokenExpired = () => {
      keycloak.updateToken(MIN_TOKEN_VALIDITY).catch(() => {
        if (isActive) setStatus("expired");
      });
    };

    return () => {
      isActive = false;
      keycloak.onTokenExpired = undefined;
    };
  }, []);

  useEffect(() => {
    if (status === "suspended") router.replace("/account-suspended");
  }, [status, router]);

  const markExpired = useCallback(
    () =>
      setStatus((current) =>
        current === "authenticated" ? "expired" : current,
      ),
    [],
  );
  const markSuspended = useCallback(() => setStatus("suspended"), []);
  const logout = useCallback(async () => {
    setStatus("unauthenticated");
    await getKeycloak().logout({
      redirectUri: `${window.location.origin}/login`,
    });
  }, []);

  const value = useMemo(
    () => ({ status, markExpired, markSuspended, logout }),
    [status, markExpired, markSuspended, logout],
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
            setStatus("unauthenticated");
            router.push("/login");
          }}
        />
      </Dialog>
    </AuthContext>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
