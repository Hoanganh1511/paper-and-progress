"use client";

import { useId, useState, type FormEvent, type ReactNode } from "react";
import { Button, FormField, Input, Stack, Text } from "@/design-system";
import { focusField, getFormString } from "../../validation";
import { AuthFormHeader, FormError } from "../shared";
import { OTPVerification } from "../OTPVerification";

export interface MfaChallengeLabels {
  otpTitle: string;
  otpDescription: string;
  otpSubmit: string;
  useBackupCode: string;
  backupTitle: string;
  backupDescription: string;
  backupCode: string;
  backupSubmit: string;
  backupRequired: string;
  useAuthenticator: string;
}

export const defaultMfaChallengeLabels: MfaChallengeLabels = {
  otpTitle: "Xác thực hai bước",
  otpDescription: "Nhập mã {length} số từ ứng dụng xác thực của bạn.",
  otpSubmit: "Xác nhận",
  useBackupCode: "Dùng mã khôi phục",
  backupTitle: "Dùng mã khôi phục",
  backupDescription:
    "Nhập một trong các mã khôi phục (dạng xxxx-xxxx) bạn đã lưu khi bật xác thực hai bước. Mỗi mã chỉ dùng được một lần.",
  backupCode: "Mã khôi phục",
  backupSubmit: "Xác nhận",
  backupRequired: "Nhập mã khôi phục.",
  useAuthenticator: "Dùng mã từ ứng dụng xác thực",
};

export interface MfaChallengeProps {
  /** Called with the code, and whether it is a backup code rather than an OTP. */
  onVerify: (values: { code: string; isBackupCode: boolean }) => void;
  isSubmitting?: boolean;
  /** An error about the code, e.g. "That code is incorrect". */
  error?: ReactNode;
  length?: number;
  /** Replace any of the texts (translations). `{length}` is the OTP length. */
  labels?: Partial<MfaChallengeLabels>;
}

const linkButtonClasses =
  "self-center rounded-sharp font-body text-body-md font-medium text-text-primary underline underline-offset-4 hover:text-text-secondary";

/**
 * Second sign-in step: a six-digit one-time code, with a switch to a backup
 * code for users who lost their authenticator.
 */
export function MfaChallenge({
  onVerify,
  isSubmitting = false,
  error,
  length = 6,
  labels: labelOverrides,
}: MfaChallengeProps) {
  const labels = { ...defaultMfaChallengeLabels, ...labelOverrides };
  const titleId = useId();
  const [isBackupMode, setIsBackupMode] = useState(false);
  const [backupError, setBackupError] = useState<string>();

  function handleBackupSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const code = getFormString(new FormData(form), "backupCode").trim();
    if (!code) {
      setBackupError(labels.backupRequired);
      focusField(form, "backupCode");
      return;
    }
    setBackupError(undefined);
    onVerify({ code, isBackupCode: true });
  }

  if (isBackupMode) {
    return (
      <form noValidate aria-labelledby={titleId} onSubmit={handleBackupSubmit}>
        <Stack gap={6}>
          <AuthFormHeader
            title={labels.backupTitle}
            description={labels.backupDescription}
            titleId={titleId}
          />
          {error && <FormError>{error}</FormError>}
          <FormField label={labels.backupCode} error={backupError} required>
            <Input
              name="backupCode"
              autoComplete="one-time-code"
              autoCapitalize="none"
              spellCheck={false}
              disabled={isSubmitting}
              onChange={() => setBackupError(undefined)}
            />
          </FormField>
          <Button
            type="submit"
            size="comfortable"
            isFullWidth
            isLoading={isSubmitting}
          >
            {labels.backupSubmit}
          </Button>
          <Text size="body-md" className="text-center">
            <button
              type="button"
              className={linkButtonClasses}
              onClick={() => setIsBackupMode(false)}
            >
              {labels.useAuthenticator}
            </button>
          </Text>
        </Stack>
      </form>
    );
  }

  return (
    <Stack gap={4}>
      <OTPVerification
        length={length}
        isSubmitting={isSubmitting}
        error={error}
        resendCooldown={0}
        labels={{
          title: labels.otpTitle,
          description: labels.otpDescription,
          submit: labels.otpSubmit,
          codeLegend: "Mã xác thực",
          digitLabel: "Số {index} trên {length}",
          incompleteCode: "Nhập đủ {length} số.",
        }}
        onVerify={(code) => onVerify({ code, isBackupCode: false })}
      />
      <button
        type="button"
        className={linkButtonClasses}
        onClick={() => setIsBackupMode(true)}
      >
        {labels.useBackupCode}
      </button>
    </Stack>
  );
}
