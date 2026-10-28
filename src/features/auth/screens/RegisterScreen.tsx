"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RegisterForm } from "../components/RegisterForm";
import { AuthApiError } from "../authApi";
import { useAuth, useRateLimit } from "../hooks";
import { registerLabels } from "../labels";
import { AUTH_ERROR_MESSAGES, rateLimitedMessage } from "../messages";

/** `/register`: creates the account, then asks the user to verify their email. */
export function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const rateLimit = useRateLimit();
  const [errors, setErrors] = useState<{ email?: string }>({});

  async function handleSubmit(values: {
    name: string;
    email: string;
    password: string;
  }) {
    if (rateLimit.isLimited) return;
    setIsSubmitting(true);
    setError(undefined);
    setErrors({});
    try {
      await register(values);
      router.push(`/verify-email?email=${encodeURIComponent(values.email)}`);
    } catch (caught) {
      if (rateLimit.handle(caught)) {
        setError(undefined);
        setIsSubmitting(false);
        return;
      }
      const code = caught instanceof AuthApiError ? caught.code : "unknown";
      if (code === "email_taken")
        setErrors({ email: AUTH_ERROR_MESSAGES[code] });
      else setError(AUTH_ERROR_MESSAGES[code]);
      setIsSubmitting(false);
    }
  }

  return (
    <RegisterForm
      labels={registerLabels}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      error={
        rateLimit.isLimited ? rateLimitedMessage(rateLimit.secondsLeft) : error
      }
      errors={errors}
      signInHref="/login"
    />
  );
}
