"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, Stack } from "@/design-system";
import { LoginForm } from "../components/LoginForm";
import { SocialLoginButtons } from "../components/SocialLoginButtons";
import { AuthApiError } from "../authApi";
import { useAuth, useRateLimit } from "../hooks";
import { loginLabels, socialLoginLabels } from "../labels";
import { describeAuthError, rateLimitedMessage } from "../messages";
import { startSocialLogin, type SocialProvider } from "../socialAuth";

/** `/login`: signs in with email and password, or hands off to Google, Facebook or GitHub. */
export function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const params = useSearchParams();
  const notice = params.get("reset")
    ? "Đã đặt lại mật khẩu. Hãy đăng nhập bằng mật khẩu mới."
    : params.get("verified")
      ? "Email đã được xác minh. Hãy đăng nhập để tiếp tục."
      : params.get("registered")
        ? "Đăng ký thành công. Hãy đăng nhập để bắt đầu."
        : undefined;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const rateLimit = useRateLimit();
  const [isRedirecting, setIsRedirecting] = useState(false);

  /** Leaves for the provider through the backend, which sends the visitor back to /auth/callback. */
  function handleSocial(provider: SocialProvider) {
    setError(undefined);
    setIsRedirecting(true);
    startSocialLogin(provider);
  }

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
        setError(describeAuthError(caught));
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
        isSubmitting={isSubmitting || isRedirecting}
        error={
          rateLimit.isLimited
            ? rateLimitedMessage(rateLimit.secondsLeft)
            : error
        }
        forgotPasswordHref="/forgot-password"
        signUpHref="/register"
        footer={
          <SocialLoginButtons
            labels={socialLoginLabels}
            onSelect={handleSocial}
            isDisabled={isSubmitting || isRedirecting}
          />
        }
      />
    </Stack>
  );
}
