"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MfaChallenge } from "../components/MfaChallenge";
import { AuthApiError, authApi } from "../authApi";
import { AUTH_ERROR_MESSAGES } from "../messages";

/** `/mfa-challenge?ticket=…`: the second sign-in step when 2FA is on. */
export function MfaChallengeScreen() {
  const router = useRouter();
  const ticket = useSearchParams().get("ticket");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  async function handleVerify(values: { code: string; isBackupCode: boolean }) {
    if (!ticket) return;
    setIsSubmitting(true);
    setError(undefined);
    try {
      await authApi.verifyMfa({ mfaToken: ticket, ...values });
      router.push("/");
      router.refresh();
    } catch (caught) {
      const code = caught instanceof AuthApiError ? caught.code : "unknown";
      if (code === "account_suspended") router.push("/account-suspended");
      else setError(AUTH_ERROR_MESSAGES[code]);
      setIsSubmitting(false);
    }
  }

  return (
    <MfaChallenge
      onVerify={handleVerify}
      isSubmitting={isSubmitting}
      error={ticket ? error : AUTH_ERROR_MESSAGES.invalid_token}
    />
  );
}
