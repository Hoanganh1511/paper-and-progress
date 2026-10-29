"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, Stack } from "@/design-system";
import { LoginForm } from "../components/LoginForm";
import { AuthApiError } from "../authApi";
import { useAuth, useRateLimit } from "../hooks";
import { loginLabels } from "../labels";
import { getAuthErrorMessage, rateLimitedMessage } from "../messages";

/** `/login`: signs in, then continues to 2FA, email verification or the app. */
export function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const params = useSearchParams();
  const notice = params.get("reset")
    ? "Đã đặt lại mật khẩu. Hãy đăng nhập bằng mật khẩu mới."
    : params.get("verified")
      ? "Email đã được xác minh. Hãy đăng nhập để tiếp tục."
      : undefined;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const rateLimit = useRateLimit();

  async function handleSubmit(values: {
    email: string;
    password: string;
    rememberMe: boolean;
  }) {
    if (rateLimit.isLimited) return;
    setIsSubmitting(true);
    setError(undefined);
    try {
      const result = await login(values);
      if (result.status === "mfa_required") {
        router.push(
          `/mfa-challenge?ticket=${encodeURIComponent(result.mfaToken)}`,
        );
        return;
      }
      router.push("/");
    } catch (caught) {
      if (rateLimit.handle(caught)) {
        setError(undefined);
        setIsSubmitting(false);
        return;
      }
      const code = caught instanceof AuthApiError ? caught.code : "unknown";
      if (code === "email_not_verified") {
        router.push(`/verify-email?email=${encodeURIComponent(values.email)}`);
      } else if (code === "account_suspended") {
        router.push("/account-suspended");
      } else {
        setError(getAuthErrorMessage(caught));
      }
      setIsSubmitting(false);
    }
  }

  return (
    <Stack gap={4}>
      {notice && (
        <Alert variant="success" role="status">
          {notice}
        </Alert>
      )}
      <LoginForm
        labels={loginLabels}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        error={
          rateLimit.isLimited
            ? rateLimitedMessage(rateLimit.secondsLeft)
            : error
        }
        forgotPasswordHref="/forgot-password"
        signUpHref="/register"
      />
    </Stack>
  );
}
