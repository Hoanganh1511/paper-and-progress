"use client";

import { useState } from "react";
import { ForgotPasswordForm } from "../components/ForgotPasswordForm";
import { AuthApiError, authApi } from "../authApi";
import { forgotPasswordLabels } from "../labels";
import { AUTH_ERROR_MESSAGES } from "../messages";

/** `/forgot-password`: requests the reset link and shows "check your email". */
export function ForgotPasswordScreen() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [error, setError] = useState<string>();

  async function handleSubmit({ email }: { email: string }) {
    setIsSubmitting(true);
    setError(undefined);
    try {
      await authApi.requestPasswordReset(email);
      setIsEmailSent(true);
    } catch (caught) {
      const code = caught instanceof AuthApiError ? caught.code : "unknown";
      setError(AUTH_ERROR_MESSAGES[code]);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ForgotPasswordForm
      labels={forgotPasswordLabels}
      onSubmit={handleSubmit}
      onResend={handleSubmit}
      isSubmitting={isSubmitting}
      isEmailSent={isEmailSent}
      error={error}
      signInHref="/login"
    />
  );
}
