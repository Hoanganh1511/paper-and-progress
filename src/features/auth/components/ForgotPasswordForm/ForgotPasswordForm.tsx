"use client";

import {
  useId,
  useState,
  type ComponentProps,
  type FormEvent,
  type ReactNode,
  type Ref,
} from "react";
import { MailCheck } from "lucide-react";
import { Button, FormField, Icon, Input, Stack, Text } from "@/design-system";
import { focusField, getFormString, isValidEmail } from "../../validation";
import { AuthFormHeader, FormError, authLinkClasses } from "../shared";

export interface ForgotPasswordFormLabels {
  title: string;
  description: string;
  email: string;
  submit: string;
  backToSignIn: string;
  emailRequired: string;
  emailInvalid: string;
  sentTitle: string;
  /** `{email}` is replaced with the address the link was sent to. */
  sentDescription: string;
  resend: string;
}

export const defaultForgotPasswordFormLabels: ForgotPasswordFormLabels = {
  title: "Forgot your password?",
  description: "Enter your email and we will send you a link to reset it.",
  email: "Email",
  submit: "Send reset link",
  backToSignIn: "Back to sign in",
  emailRequired: "Enter your email.",
  emailInvalid: "Enter a valid email address.",
  sentTitle: "Check your email",
  sentDescription: "We sent a password reset link to {email}.",
  resend: "Resend email",
};

export interface ForgotPasswordFormProps extends Omit<
  ComponentProps<"form">,
  "onSubmit" | "children" | "ref"
> {
  /** The root element: the <form>, or the confirmation once `isEmailSent`. */
  ref?: Ref<HTMLElement>;
  /** Called with the email once it passes validation. */
  onSubmit: (values: { email: string }) => void;
  /** Called with the same email when the user asks for the link again. */
  onResend?: (values: { email: string }) => void;
  isSubmitting?: boolean;
  /** Switch to the "check your email" confirmation once the request succeeded. */
  isEmailSent?: boolean;
  /** A form-level error, e.g. "Too many attempts, try again later". */
  error?: ReactNode;
  /** An error for the email field reported by the server. */
  emailError?: string;
  defaultEmail?: string;
  signInHref?: string;
  /** Replace any of the texts (translations). */
  labels?: Partial<ForgotPasswordFormLabels>;
}

/**
 * Password-reset request form with its confirmation state. The caller sends
 * the request in `onSubmit` and sets `isEmailSent` when it succeeds.
 */
export function ForgotPasswordForm({
  onSubmit,
  onResend,
  isSubmitting = false,
  isEmailSent = false,
  error,
  emailError,
  defaultEmail,
  signInHref,
  labels: labelOverrides,
  className,
  ref,
  ...props
}: ForgotPasswordFormProps) {
  const labels = { ...defaultForgotPasswordFormLabels, ...labelOverrides };
  const titleId = useId();
  const [clientError, setClientError] = useState<string>();
  const [submittedEmail, setSubmittedEmail] = useState(defaultEmail ?? "");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const email = getFormString(new FormData(form), "email").trim();

    let nextError: string | undefined;
    if (!email) nextError = labels.emailRequired;
    else if (!isValidEmail(email)) nextError = labels.emailInvalid;

    setClientError(nextError);
    if (nextError) {
      focusField(form, "email");
      return;
    }

    setSubmittedEmail(email);
    onSubmit({ email });
  }

  const backLink = signInHref && (
    <a href={signInHref} className={`${authLinkClasses} text-center`}>
      {labels.backToSignIn}
    </a>
  );

  if (isEmailSent) {
    return (
      <div ref={ref as Ref<HTMLDivElement>} role="status" className={className}>
        <Stack gap={6} align="center" className="text-center">
          <span className="flex size-12 items-center justify-center rounded-pill bg-success-bg">
            <Icon icon={MailCheck} size={24} color="success" />
          </span>
          <AuthFormHeader
            title={labels.sentTitle}
            description={labels.sentDescription.replace(
              "{email}",
              submittedEmail,
            )}
            titleId={titleId}
          />
          {onResend && (
            <Button
              variant="outline"
              isLoading={isSubmitting}
              onClick={() => onResend({ email: submittedEmail })}
            >
              {labels.resend}
            </Button>
          )}
          {backLink}
        </Stack>
      </div>
    );
  }

  return (
    <form
      ref={ref as Ref<HTMLFormElement>}
      noValidate
      aria-labelledby={titleId}
      className={className}
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
          label={labels.email}
          error={clientError ?? emailError}
          required
        >
          <Input
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={defaultEmail}
            disabled={isSubmitting}
            onChange={() => setClientError(undefined)}
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
            {backLink}
          </Text>
        )}
      </Stack>
    </form>
  );
}
