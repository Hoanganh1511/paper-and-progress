"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, LinkButton, Stack } from "@/design-system";
import { AuthSplash } from "../components/AuthSplash";
import { AuthApiError } from "../authApi";
import { useAuth } from "../hooks";
import { AUTH_ERROR_MESSAGES, SOCIAL_CALLBACK_ERRORS } from "../messages";

/**
 * `/auth/callback`: where the backend sends the visitor after Google, Facebook
 * or GitHub, with `?accessToken=…&refreshToken=…` (or `?error=CODE`). Signs the
 * visitor in with those tokens and continues to the app. A failure ends on a
 * message with a link back to `/login`.
 */
export function SocialCallbackScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const { loginWithTokens } = useAuth();
  const [error, setError] = useState<string>();
  // The tokens are read once. React may run this effect twice in development.
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    const accessToken = params.get("accessToken");
    const refreshToken = params.get("refreshToken");
    const errorCode = params.get("error");

    // The tokens must not stay in the address bar or the browser history.
    window.history.replaceState(null, "", window.location.pathname);

    async function finish() {
      if (errorCode) {
        setError(
          SOCIAL_CALLBACK_ERRORS[errorCode] ?? SOCIAL_CALLBACK_ERRORS.default,
        );
        return;
      }
      if (!accessToken || !refreshToken) {
        setError(SOCIAL_CALLBACK_ERRORS.missing_tokens);
        return;
      }
      try {
        await loginWithTokens({ accessToken, refreshToken });
        router.replace("/");
      } catch (caught) {
        const failure =
          caught instanceof AuthApiError ? caught.code : "unknown";
        setError(
          failure === "network" || failure === "unknown"
            ? AUTH_ERROR_MESSAGES[failure]
            : SOCIAL_CALLBACK_ERRORS.default,
        );
      }
    }
    void finish();
  }, [params, router, loginWithTokens]);

  if (!error) return <AuthSplash label="Đang đăng nhập..." />;

  return (
    <Stack gap={4}>
      <Alert variant="danger">{error}</Alert>
      <LinkButton href="/login" variant="accent" size="comfortable" isFullWidth>
        Quay lại đăng nhập
      </LinkButton>
    </Stack>
  );
}
