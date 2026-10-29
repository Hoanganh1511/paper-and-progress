"use client";

import { useEffect, useId, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MailCheck } from "lucide-react";
import { Alert, Button, Icon, Stack, Text } from "@/design-system";
import {
  AuthFormHeader,
  FormError,
  authLinkClasses,
} from "../components/shared";
import { authApi } from "../authApi";
import { getAuthErrorMessage } from "../messages";

/** Seconds to show "email verified" before moving on to sign-in. */
const REDIRECT_DELAY_MS = 2000;

type VerifyState = "idle" | "verifying" | "verified" | "failed";

/**
 * `/verify-email`. Without a token it says where the email went and offers to
 * resend it (`?email=`). With one (`?token=`, from the link in the email) it
 * verifies the address and then redirects to `/login`.
 */
export function VerifyEmailScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const token = params.get("token");
  const titleId = useId();

  const [state, setState] = useState<VerifyState>(token ? "verifying" : "idle");
  const [isResending, setIsResending] = useState(false);
  const [hasResent, setHasResent] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!token) return;
    let isActive = true;
    authApi
      .verifyEmail(token)
      .then(() => isActive && setState("verified"))
      .catch((caught) => {
        if (!isActive) return;
        setError(getAuthErrorMessage(caught));
        setState("failed");
      });
    return () => {
      isActive = false;
    };
  }, [token]);

  useEffect(() => {
    if (state !== "verified") return;
    const timer = setTimeout(
      () => router.push("/login?verified=1"),
      REDIRECT_DELAY_MS,
    );
    return () => clearTimeout(timer);
  }, [state, router]);

  async function handleResend() {
    setIsResending(true);
    setError(undefined);
    setHasResent(false);
    try {
      await authApi.resendVerification(email);
      setHasResent(true);
    } catch (caught) {
      setError(getAuthErrorMessage(caught));
    } finally {
      setIsResending(false);
    }
  }

  if (token) {
    return (
      <Stack gap={6} role="status" aria-labelledby={titleId}>
        <AuthFormHeader
          titleId={titleId}
          title={
            state === "verified"
              ? "Email đã được xác minh"
              : state === "failed"
                ? "Không xác minh được email"
                : "Đang xác minh email…"
          }
          description={
            state === "verified"
              ? "Đang chuyển bạn tới trang đăng nhập."
              : undefined
          }
        />
        {state === "failed" && <FormError>{error}</FormError>}
        {state !== "verifying" && (
          <Text size="body-md" className="text-center">
            <a href="/login" className={authLinkClasses}>
              Đến trang đăng nhập
            </a>
          </Text>
        )}
      </Stack>
    );
  }

  return (
    <Stack gap={6} align="center" className="text-center">
      <span className="flex size-12 items-center justify-center rounded-pill bg-success-bg">
        <Icon icon={MailCheck} size={24} color="success" />
      </span>
      <AuthFormHeader
        title="Xác minh email của bạn"
        description={
          email ? (
            <>
              Chúng tôi đã gửi email xác minh tới <strong>{email}</strong>. Mở
              email và bấm vào liên kết để hoàn tất đăng ký.
            </>
          ) : (
            "Chúng tôi đã gửi email xác minh. Mở email và bấm vào liên kết để hoàn tất đăng ký."
          )
        }
      />
      {error && <FormError className="text-left">{error}</FormError>}
      {hasResent && (
        <Alert variant="success" role="status">
          Đã gửi lại email xác minh.
        </Alert>
      )}
      {email && (
        <Button
          variant="outline"
          isLoading={isResending}
          onClick={handleResend}
        >
          Gửi lại email
        </Button>
      )}
      <a href="/login" className={authLinkClasses}>
        Quay lại đăng nhập
      </a>
    </Stack>
  );
}
