"use client";

import {
  useId,
  useState,
  type ComponentProps,
  type FormEvent,
  type ReactNode,
} from "react";
import { Button, FormField, PasswordInput, Stack, Text } from "@/design-system";
import { focusField, getFormString } from "../../validation";
import { AuthFormHeader, FormError, authLinkClasses } from "../shared";

export interface ResetPasswordFormLabels {
  title: string;
  description: string;
  password: string;
  passwordHint: string;
  confirmPassword: string;
  submit: string;
  backToSignIn: string;
  passwordRequired: string;
  passwordTooShort: string;
  confirmPasswordRequired: string;
  passwordMismatch: string;
}

export const defaultResetPasswordFormLabels: ResetPasswordFormLabels = {
  title: "Đặt lại mật khẩu",
  description: "Chọn mật khẩu mới cho tài khoản của bạn.",
  password: "Mật khẩu mới",
  passwordHint: "Ít nhất {min} ký tự.",
  confirmPassword: "Nhập lại mật khẩu mới",
  submit: "Đặt lại mật khẩu",
  backToSignIn: "Quay lại đăng nhập",
  passwordRequired: "Nhập mật khẩu mới.",
  passwordTooShort: "Dùng ít nhất {min} ký tự.",
  confirmPasswordRequired: "Nhập lại mật khẩu mới.",
  passwordMismatch: "Hai mật khẩu không khớp.",
};

type ResetPasswordField = "password" | "confirmPassword";

const FIELD_ORDER: ResetPasswordField[] = ["password", "confirmPassword"];

export interface ResetPasswordFormProps extends Omit<
  ComponentProps<"form">,
  "onSubmit" | "children"
> {
  /** Called with the new password once the form passes validation. */
  onSubmit: (values: { password: string }) => void;
  isSubmitting?: boolean;
  /** A form-level error, e.g. "The link has expired". */
  error?: ReactNode;
  /** Field errors reported by the server. */
  errors?: Partial<Record<ResetPasswordField, string>>;
  minPasswordLength?: number;
  signInHref?: string;
  /** Replace any of the texts (translations). `{min}` is the minimum password length. */
  labels?: Partial<ResetPasswordFormLabels>;
}

/** Sets a new password: validates the length and that both entries match. */
export function ResetPasswordForm({
  onSubmit,
  isSubmitting = false,
  error,
  errors,
  minPasswordLength = 8,
  signInHref,
  labels: labelOverrides,
  ...props
}: ResetPasswordFormProps) {
  const labels = { ...defaultResetPasswordFormLabels, ...labelOverrides };
  const titleId = useId();
  const [clientErrors, setClientErrors] = useState<
    Partial<Record<ResetPasswordField, string>>
  >({});
  const withMin = (text: string) =>
    text.replace("{min}", `${minPasswordLength}`);

  function clearError(field: ResetPasswordField) {
    setClientErrors((current) => ({ ...current, [field]: undefined }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const password = getFormString(formData, "password");
    const confirmPassword = getFormString(formData, "confirmPassword");

    const nextErrors: Partial<Record<ResetPasswordField, string>> = {};
    if (!password) nextErrors.password = labels.passwordRequired;
    else if (password.length < minPasswordLength) {
      nextErrors.password = withMin(labels.passwordTooShort);
    }
    if (!confirmPassword) {
      nextErrors.confirmPassword = labels.confirmPasswordRequired;
    } else if (confirmPassword !== password) {
      nextErrors.confirmPassword = labels.passwordMismatch;
    }

    setClientErrors(nextErrors);
    const firstInvalid = FIELD_ORDER.find((field) => nextErrors[field]);
    if (firstInvalid) {
      focusField(form, firstInvalid);
      return;
    }

    onSubmit({ password });
  }

  return (
    <form
      noValidate
      aria-labelledby={titleId}
      onSubmit={handleSubmit}
      {...props}
    >
      <Stack gap={6}>
        <AuthFormHeader
          title={labels.title}
          description={labels.description}
          titleId={titleId}
        />
        {error && <FormError>{error}</FormError>}
        <FormField
          label={labels.password}
          description={withMin(labels.passwordHint)}
          error={clientErrors.password ?? errors?.password}
          required
        >
          <PasswordInput
            name="password"
            autoComplete="new-password"
            disabled={isSubmitting}
            onChange={() => clearError("password")}
          />
        </FormField>
        <FormField
          label={labels.confirmPassword}
          error={clientErrors.confirmPassword ?? errors?.confirmPassword}
          required
        >
          <PasswordInput
            name="confirmPassword"
            autoComplete="new-password"
            disabled={isSubmitting}
            onChange={() => clearError("confirmPassword")}
          />
        </FormField>
        <Button
          type="submit"
          size="comfortable"
          isFullWidth
          isLoading={isSubmitting}
        >
          {labels.submit}
        </Button>
        {signInHref && (
          <Text size="body-md" className="text-center">
            <a href={signInHref} className={authLinkClasses}>
              {labels.backToSignIn}
            </a>
          </Text>
        )}
      </Stack>
    </form>
  );
}
