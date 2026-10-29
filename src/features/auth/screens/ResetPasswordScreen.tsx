"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ResetPasswordForm } from "../components/ResetPasswordForm";
import { authApi } from "../authApi";
import { AUTH_ERROR_MESSAGES, describeAuthError } from "../messages";

/** `/reset-password?token=…`: sets the new password, then goes to sign-in. */
export function ResetPasswordScreen() {
  const router = useRouter();
  const token = useSearchParams().get("token");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  async function handleSubmit({ password }: { password: string }) {
    if (!token) return;
    setIsSubmitting(true);
    setError(undefined);
    try {
      await authApi.resetPassword({ token, password });
      router.push("/login?reset=1");
    } catch (caught) {
      setError(describeAuthError(caught));
      setIsSubmitting(false);
    }
  }

  return (
    <ResetPasswordForm
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      error={token ? error : AUTH_ERROR_MESSAGES.invalid_token}
      signInHref="/login"
    />
  );
}
