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
  Input,
  PasswordInput,
  Stack,
  Text,
} from "@/design-system";
import { focusField, getFormString, isValidEmail } from "../../validation";
import { AuthFormHeader, FormError, authLinkClasses } from "../shared";

export interface RegisterValues {
  name: string;
  email: string;
  password: string;
}

export interface RegisterFormLabels {
  title: string;
  description: string;
  name: string;
  email: string;
  password: string;
  passwordHint: string;
  confirmPassword: string;
  acceptTerms: ReactNode;
  submit: string;
  haveAccount: string;
  signIn: string;
  nameRequired: string;
  emailRequired: string;
  emailInvalid: string;
  passwordRequired: string;
  passwordTooShort: string;
  confirmPasswordRequired: string;
  passwordMismatch: string;
  termsRequired: string;
}

export const defaultRegisterFormLabels: RegisterFormLabels = {
  title: "Create your account",
  description: "Start in a minute. No credit card needed.",
  name: "Full name",
  email: "Email",
  password: "Password",
  passwordHint: "At least {min} characters.",
  confirmPassword: "Confirm password",
  acceptTerms: "I agree to the Terms of Service and Privacy Policy",
  submit: "Create account",
  haveAccount: "Already have an account?",
  signIn: "Sign in",
  nameRequired: "Enter your name.",
  emailRequired: "Enter your email.",
  emailInvalid: "Enter a valid email address.",
  passwordRequired: "Choose a password.",
  passwordTooShort: "Use at least {min} characters.",
  confirmPasswordRequired: "Confirm your password.",
  passwordMismatch: "The passwords do not match.",
  termsRequired: "You need to accept the terms to continue.",
};

type RegisterField =
  "name" | "email" | "password" | "confirmPassword" | "acceptTerms";

const FIELD_ORDER: RegisterField[] = [
  "name",
  "email",
  "password",
  "confirmPassword",
  "acceptTerms",
];

export interface RegisterFormProps extends Omit<
  ComponentProps<"form">,
  "onSubmit" | "children"
> {
  /** Called with the values once the form passes validation. */
  onSubmit: (values: RegisterValues) => void;
  isSubmitting?: boolean;
  /** A form-level error, e.g. "Something went wrong, try again". */
  error?: ReactNode;
  /** Field errors reported by the server, e.g. "Email already in use". */
  errors?: Partial<Record<RegisterField, string>>;
  minPasswordLength?: number;
  signInHref?: string;
  /** Extra content between the submit button and the sign-in link, e.g. social sign-up. */
  footer?: ReactNode;
  /** Replace any of the texts (translations). `{min}` is the minimum password length. */
  labels?: Partial<RegisterFormLabels>;
}

/**
 * Sign-up form. It validates the fields (including matching passwords and
 * accepted terms) and hands the values to `onSubmit`; creating the account
 * and showing server errors (`error`, `errors`) are up to the caller.
 */
export function RegisterForm({
  onSubmit,
  isSubmitting = false,
  error,
  errors: serverErrors,
  minPasswordLength = 8,
  signInHref,
  footer,
  labels: labelOverrides,
  ref,
  ...props
}: RegisterFormProps) {
  const labels = { ...defaultRegisterFormLabels, ...labelOverrides };
  const withMin = (text: string) =>
    text.replace("{min}", String(minPasswordLength));
  const titleId = useId();
  const termsErrorId = useId();
  const [clientErrors, setClientErrors] = useState<
    Partial<Record<RegisterField, string>>
  >({});
  const errors = { ...serverErrors, ...clientErrors };

  function clearError(field: RegisterField) {
    setClientErrors((current) => ({ ...current, [field]: undefined }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = getFormString(formData, "name").trim();
    const email = getFormString(formData, "email").trim();
    const password = getFormString(formData, "password");
    const confirmPassword = getFormString(formData, "confirmPassword");
    const acceptTerms = formData.get("acceptTerms") === "on";

    const nextErrors: Partial<Record<RegisterField, string>> = {};
    if (!name) nextErrors.name = labels.nameRequired;
    if (!email) nextErrors.email = labels.emailRequired;
    else if (!isValidEmail(email)) nextErrors.email = labels.emailInvalid;
    if (!password) nextErrors.password = labels.passwordRequired;
    else if (password.length < minPasswordLength) {
      nextErrors.password = withMin(labels.passwordTooShort);
    }
    if (!confirmPassword) {
      nextErrors.confirmPassword = labels.confirmPasswordRequired;
    } else if (confirmPassword !== password) {
      nextErrors.confirmPassword = labels.passwordMismatch;
    }
    if (!acceptTerms) nextErrors.acceptTerms = labels.termsRequired;

    setClientErrors(nextErrors);
    const firstInvalid = FIELD_ORDER.find((field) => nextErrors[field]);
    if (firstInvalid) {
      focusField(form, firstInvalid);
      return;
    }

    onSubmit({ name, email, password });
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
          <FormField label={labels.name} error={errors.name} required>
            <Input
              name="name"
              autoComplete="name"
              disabled={isSubmitting}
              onChange={() => clearError("name")}
            />
          </FormField>
          <FormField label={labels.email} error={errors.email} required>
            <Input
              name="email"
              type="email"
              autoComplete="email"
              disabled={isSubmitting}
              onChange={() => clearError("email")}
            />
          </FormField>
          <FormField
            label={labels.password}
            description={withMin(labels.passwordHint)}
            error={errors.password}
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
            error={errors.confirmPassword}
            required
          >
            <PasswordInput
              name="confirmPassword"
              autoComplete="new-password"
              disabled={isSubmitting}
              onChange={() => clearError("confirmPassword")}
            />
          </FormField>
          <Stack gap={1}>
            <Checkbox
              name="acceptTerms"
              label={labels.acceptTerms}
              disabled={isSubmitting}
              aria-invalid={errors.acceptTerms ? true : undefined}
              aria-describedby={errors.acceptTerms ? termsErrorId : undefined}
              onChange={() => clearError("acceptTerms")}
            />
            {errors.acceptTerms && (
              <Text
                as="p"
                id={termsErrorId}
                role="alert"
                size="body-sm"
                color="danger"
              >
                {errors.acceptTerms}
              </Text>
            )}
          </Stack>
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
        {signInHref && (
          <Text size="body-md" color="secondary" className="text-center">
            {labels.haveAccount}{" "}
            <a href={signInHref} className={authLinkClasses}>
              {labels.signIn}
            </a>
          </Text>
        )}
      </Stack>
    </form>
  );
}
