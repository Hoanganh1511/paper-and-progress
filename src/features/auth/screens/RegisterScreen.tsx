"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RegisterForm } from "../components/RegisterForm";
import { SocialLoginButtons } from "../components/SocialLoginButtons";
import { AuthApiError } from "../authApi";
import { useAuth, useRateLimit } from "../hooks";
import { registerLabels, socialRegisterLabels } from "../labels";
import {
  AUTH_ERROR_MESSAGES,
  describeAuthError,
  rateLimitedMessage,
} from "../messages";
import { startSocialLogin, type SocialProvider } from "../socialAuth";

/** `/register`: creates the account and sends the visitor to sign in, or signs up through Google, Facebook or GitHub. */
export function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const rateLimit = useRateLimit();
  const [errors, setErrors] = useState<{ email?: string }>({});
  const [isRedirecting, setIsRedirecting] = useState(false);

  /** Same flow as signing in: the backend creates the account on the first visit. */
  function handleSocial(provider: SocialProvider) {
    setError(undefined);
    setIsRedirecting(true);
    startSocialLogin(provider);
  }

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
      // The backend sends no verification email: the account works at once.
      router.push("/login?registered=1");
    } catch (caught) {
      if (rateLimit.handle(caught)) {
        setError(undefined);
        setIsSubmitting(false);
        return;
      }
      const code = caught instanceof AuthApiError ? caught.code : "unknown";
      if (code === "email_taken")
        setErrors({ email: AUTH_ERROR_MESSAGES[code] });
      else setError(describeAuthError(caught));
      setIsSubmitting(false);
    }
  }

  return (
    <RegisterForm
      labels={registerLabels}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting || isRedirecting}
      error={
        rateLimit.isLimited ? rateLimitedMessage(rateLimit.secondsLeft) : error
      }
      errors={errors}
      signInHref="/login"
      footer={
        <SocialLoginButtons
          labels={socialRegisterLabels}
          onSelect={handleSocial}
          isDisabled={isSubmitting || isRedirecting}
        />
      }
    />
  );
}
