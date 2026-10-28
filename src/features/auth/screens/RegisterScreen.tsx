"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RegisterForm } from "../components/RegisterForm";
import { AuthApiError } from "../authApi";
import { useAuth } from "../hooks";
import { registerLabels } from "../labels";
import { AUTH_ERROR_MESSAGES } from "../messages";

/** `/register`: creates the account, then asks the user to verify their email. */
export function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const [errors, setErrors] = useState<{ email?: string }>({});

  async function handleSubmit(values: {
    name: string;
    email: string;
    password: string;
  }) {
    setIsSubmitting(true);
    setError(undefined);
    setErrors({});
    try {
      await register(values);
      router.push(`/verify-email?email=${encodeURIComponent(values.email)}`);
    } catch (caught) {
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
      error={error}
      errors={errors}
      signInHref="/login"
    />
  );
}
