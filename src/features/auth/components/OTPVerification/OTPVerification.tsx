"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ClipboardEvent,
  type ComponentProps,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { CircleAlert } from "lucide-react";
import { Button, Inline, Input, Stack, Text } from "@/design-system";
import { AuthFormHeader } from "../shared";

export interface OTPVerificationLabels {
  title: string;
  /** `{email}` is replaced with `email` when given. */
  description: string;
  codeLegend: string;
  /** `{index}` and `{length}` are replaced, e.g. "Digit 1 of 6". */
  digitLabel: string;
  submit: string;
  didntGetCode: string;
  resend: string;
  /** `{seconds}` is replaced with the remaining seconds. */
  resendIn: string;
  /** `{length}` is replaced with the code length. */
  incompleteCode: string;
}

export const defaultOTPVerificationLabels: OTPVerificationLabels = {
  title: "Verify your email",
  description: "Enter the {length}-digit code we sent to {email}.",
  codeLegend: "Verification code",
  digitLabel: "Digit {index} of {length}",
  submit: "Verify",
  didntGetCode: "Didn't get the code?",
  resend: "Resend code",
  resendIn: "Resend in {seconds}s",
  incompleteCode: "Enter all {length} digits.",
};

export interface OTPVerificationProps extends Omit<
  ComponentProps<"form">,
  "onSubmit" | "children"
> {
  /** Called with the full code when the form is submitted. */
  onVerify: (code: string) => void;
  /** Called as soon as the last digit is entered, e.g. to verify right away. */
  onComplete?: (code: string) => void;
  /** Called when the user asks for a new code (after the cooldown). */
  onResend?: () => void;
  length?: number;
  /** Address the code was sent to, shown in the description. */
  email?: string;
  /** Seconds to wait before "Resend" is available, at the start and after each resend. 0 disables the wait. */
  resendCooldown?: number;
  isSubmitting?: boolean;
  /** An error about the code, e.g. "That code is incorrect". */
  error?: ReactNode;
  /** Replace any of the texts (translations). */
  labels?: Partial<OTPVerificationLabels>;
}

function fill(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

/**
 * Digit-by-digit code entry: typing moves forward, Backspace and the arrow
 * keys move around, and pasting a code fills every box. The caller checks the
 * code in `onVerify` / `onComplete` and reports problems through `error`.
 */
export function OTPVerification({
  onVerify,
  onComplete,
  onResend,
  length = 6,
  email,
  resendCooldown = 30,
  isSubmitting = false,
  error,
  labels: labelOverrides,
  ref,
  ...props
}: OTPVerificationProps) {
  const labels = { ...defaultOTPVerificationLabels, ...labelOverrides };
  const titleId = useId();
  const errorId = useId();
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [digits, setDigits] = useState<string[]>(() =>
    Array.from({ length }, () => ""),
  );
  const [incompleteError, setIncompleteError] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(resendCooldown);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(
      () => setSecondsLeft((current) => current - 1),
      1000,
    );
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const shownError =
    error ??
    (incompleteError ? fill(labels.incompleteCode, { length }) : undefined);

  function focusInput(index: number) {
    inputRefs.current[index]?.focus();
  }

  function updateDigits(next: string[]) {
    setDigits(next);
    setIncompleteError(false);
    if (next.every(Boolean)) onComplete?.(next.join(""));
  }

  function handleChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    updateDigits(next);
    if (digit && index < length - 1) focusInput(index + 1);
  }

  function handleKeyDown(
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
  ) {
    switch (event.key) {
      case "Backspace":
        if (!digits[index] && index > 0) {
          event.preventDefault();
          const next = [...digits];
          next[index - 1] = "";
          updateDigits(next);
          focusInput(index - 1);
        }
        break;
      case "ArrowLeft":
        event.preventDefault();
        focusInput(Math.max(index - 1, 0));
        break;
      case "ArrowRight":
        event.preventDefault();
        focusInput(Math.min(index + 1, length - 1));
        break;
      case "Home":
        event.preventDefault();
        focusInput(0);
        break;
      case "End":
        event.preventDefault();
        focusInput(length - 1);
        break;
    }
  }

  function handlePaste(index: number, event: ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasted) return;
    event.preventDefault();
    const next = [...digits];
    for (
      let offset = 0;
      offset < pasted.length && index + offset < length;
      offset += 1
    ) {
      next[index + offset] = pasted[offset];
    }
    updateDigits(next);
    focusInput(Math.min(index + pasted.length, length - 1));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const firstEmpty = digits.findIndex((digit) => !digit);
    if (firstEmpty !== -1) {
      setIncompleteError(true);
      focusInput(firstEmpty);
      return;
    }
    onVerify(digits.join(""));
  }

  function handleResend() {
    setSecondsLeft(resendCooldown);
    setDigits(Array.from({ length }, () => ""));
    setIncompleteError(false);
    focusInput(0);
    onResend?.();
  }

  const description = fill(labels.description, {
    length,
    email: email ?? "your email",
  });

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
          description={description}
          titleId={titleId}
        />
        <fieldset className="m-0 min-w-0 border-0 p-0">
          <legend className="mb-2 font-body text-body-sm font-medium text-text-primary">
            {labels.codeLegend}
          </legend>
          <Stack gap={2}>
            <Inline gap={2} justify="center" wrap={false}>
              {digits.map((digit, index) => (
                <Input
                  // The boxes are positional and never reorder.
                  key={index}
                  ref={(node) => {
                    inputRefs.current[index] = node;
                  }}
                  value={digit}
                  size="comfortable"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  maxLength={1}
                  disabled={isSubmitting}
                  aria-label={fill(labels.digitLabel, {
                    index: index + 1,
                    length,
                  })}
                  aria-invalid={shownError ? true : undefined}
                  aria-describedby={shownError ? errorId : undefined}
                  className="w-11 px-0 sm:w-12 [&_input]:text-center"
                  onChange={(event) => handleChange(index, event.target.value)}
                  onKeyDown={(event) => handleKeyDown(index, event)}
                  onPaste={(event) => handlePaste(index, event)}
                  onFocus={(event) => event.target.select()}
                />
              ))}
            </Inline>
            {shownError && (
              <p
                id={errorId}
                role="alert"
                className="flex items-start justify-center gap-1 text-center font-body text-body-sm text-danger-text"
              >
                <CircleAlert
                  aria-hidden="true"
                  size={16}
                  className="mt-0.5 shrink-0"
                />
                <span>{shownError}</span>
              </p>
            )}
          </Stack>
        </fieldset>
        <Button
          type="submit"
          size="comfortable"
          isFullWidth
          isLoading={isSubmitting}
        >
          {labels.submit}
        </Button>
        {onResend && (
          <Inline gap={1} justify="center">
            <Text size="body-md" color="secondary">
              {labels.didntGetCode}
            </Text>
            <Button
              type="button"
              variant="ghost"
              size="compact"
              disabled={secondsLeft > 0 || isSubmitting}
              onClick={handleResend}
            >
              {secondsLeft > 0
                ? fill(labels.resendIn, { seconds: secondsLeft })
                : labels.resend}
            </Button>
          </Inline>
        )}
      </Stack>
    </form>
  );
}
