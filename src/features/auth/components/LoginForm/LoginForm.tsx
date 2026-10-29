"use client";

import {
  useId,
  useState,
  type ComponentProps,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  Button,
  Checkbox,
  FormField,
  Inline,
  Input,
  PasswordInput,
  Stack,
  Text,
} from "@/design-system";
import { focusField, getFormString, isValidEmail } from "../../validation";
import { AuthFormHeader, FormError, authLinkClasses } from "../shared";

export interface LoginValues {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface LoginFormLabels {
  title: string;
  description: string;
  email: string;
  password: string;
  rememberMe: string;
  forgotPassword: string;
  submit: string;
  noAccount: string;
  signUp: string;
  emailRequired: string;
  emailInvalid: string;
  passwordRequired: string;
}

export const defaultLoginFormLabels: LoginFormLabels = {
  title: "Sign in",
  description: "Welcome back. Enter your details to continue.",
  email: "Email",
  password: "Password",
  rememberMe: "Remember me",
  forgotPassword: "Forgot password?",
  submit: "Sign in",
  noAccount: "Don't have an account?",
  signUp: "Sign up",
  emailRequired: "Enter your email.",
  emailInvalid: "Enter a valid email address.",
  passwordRequired: "Enter your password.",
};

type LoginField = "email" | "password";

export interface LoginFormProps extends Omit<
  ComponentProps<"form">,
  "onSubmit" | "children"
> {
  /** Called with the values once the form passes validation. */
  onSubmit: (values: LoginValues) => void;
  isSubmitting?: boolean;
  /** A form-level error, e.g. "Wrong email or password". */
  error?: ReactNode;
  /** Field errors reported by the server. */
  errors?: Partial<Record<LoginField, string>>;
  defaultEmail?: string;
  forgotPasswordHref?: string;
  signUpHref?: string;
  /** Extra content between the submit button and the sign-up link, e.g. social sign-in. */
  footer?: ReactNode;
  /** Replace any of the texts (translations). */
  labels?: Partial<LoginFormLabels>;
}

/**
 * Sign-in form. It validates required fields and the email shape, then hands
 * the values to `onSubmit`; calling an API, redirecting and showing a server
 * error (`error`, `errors`) are up to the caller.
 */
export function LoginForm({
  onSubmit,
  isSubmitting = false,
  error,
  errors: serverErrors,
  defaultEmail,
  forgotPasswordHref,
  signUpHref,
  footer,
  labels: labelOverrides,
  ref,
  ...props
}: LoginFormProps) {
  const labels = { ...defaultLoginFormLabels, ...labelOverrides };
  const titleId = useId();
  const [clientErrors, setClientErrors] = useState<
    Partial<Record<LoginField, string>>
  >({});
  const errors = { ...serverErrors, ...clientErrors };

  function clearError(field: LoginField) {
    setClientErrors((current) => ({ ...current, [field]: undefined }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = getFormString(formData, "email").trim();
    const password = getFormString(formData, "password");

    const nextErrors: Partial<Record<LoginField, string>> = {};
    if (!email) nextErrors.email = labels.emailRequired;
    else if (!isValidEmail(email)) nextErrors.email = labels.emailInvalid;
    if (!password) nextErrors.password = labels.passwordRequired;

    setClientErrors(nextErrors);
    const firstInvalid = (["email", "password"] as const).find(
      (field) => nextErrors[field],
    );
    if (firstInvalid) {
      focusField(form, firstInvalid);
      return;
    }

    onSubmit({
      email,
      password,
      rememberMe: formData.get("rememberMe") === "on",
    });
  }

  return (
    <form
      ref={ref}
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
        <Stack gap={4}>
          <FormField label={labels.email} error={errors.email} required>
            <Input
              name="email"
              type="email"
              autoComplete="email"
              defaultValue={defaultEmail}
              disabled={isSubmitting}
              onChange={() => clearError("email")}
            />
          </FormField>
          <FormField label={labels.password} error={errors.password} required>
            <PasswordInput
              name="password"
              autoComplete="current-password"
              disabled={isSubmitting}
              onChange={() => clearError("password")}
            />
          </FormField>
          <Inline justify="between" gap={4}>
            <Checkbox
              name="rememberMe"
              label={labels.rememberMe}
              disabled={isSubmitting}
            />
            {forgotPasswordHref && (
              <a href={forgotPasswordHref} className={authLinkClasses}>
                {labels.forgotPassword}
              </a>
            )}
          </Inline>
        </Stack>
        <Button
          type="submit"
          variant="accent"
          size="comfortable"
          isFullWidth
          isLoading={isSubmitting}
        >
          {labels.submit}
        </Button>
        {footer}
        {signUpHref && (
          <Text size="body-md" color="secondary" className="text-center">
            {labels.noAccount}{" "}
            <a href={signUpHref} className={authLinkClasses}>
              {labels.signUp}
            </a>
          </Text>
        )}
      </Stack>
    </form>
  );
}
