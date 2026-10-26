import { createRef } from "react";
import { vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import {
  ForgotPasswordForm,
  type ForgotPasswordFormProps,
} from "./ForgotPasswordForm";

expect.extend(toHaveNoViolations);

function setup(props: Partial<ForgotPasswordFormProps> = {}) {
  const onSubmit = vi.fn();
  const view = render(<ForgotPasswordForm onSubmit={onSubmit} {...props} />);
  return { onSubmit, ...view };
}

const email = () => screen.getByLabelText(/Email/);
const submit = () => screen.getByRole("button", { name: "Send reset link" });

describe("ForgotPasswordForm", () => {
  it("renders a labelled form with an email field and submit button", () => {
    setup();
    expect(
      screen.getByRole("form", { name: "Forgot your password?" }),
    ).toBeInTheDocument();
    expect(email()).toHaveAttribute("type", "email");
    expect(email()).toHaveAttribute("autocomplete", "email");
  });

  it("submits the trimmed email", async () => {
    const { onSubmit } = setup();
    await userEvent.type(email(), " ann@example.com ");
    await userEvent.click(submit());
    expect(onSubmit).toHaveBeenCalledWith({ email: "ann@example.com" });
  });

  it("validates the email, focusing the field and clearing the error on change", async () => {
    const { onSubmit } = setup();
    await userEvent.click(submit());
    expect(screen.getByText("Enter your email.")).toBeInTheDocument();
    expect(email()).toHaveFocus();

    await userEvent.type(email(), "ann");
    expect(screen.queryByText("Enter your email.")).not.toBeInTheDocument();
    await userEvent.click(submit());
    expect(
      screen.getByText("Enter a valid email address."),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows server errors from props", () => {
    setup({
      error: "Too many attempts",
      emailError: "No account with this email",
    });
    expect(screen.getByText("Too many attempts")).toBeInTheDocument();
    expect(screen.getByText("No account with this email")).toBeInTheDocument();
  });

  it("disables the field and shows a busy button while submitting", () => {
    setup({ isSubmitting: true });
    expect(email()).toBeDisabled();
    expect(submit()).toHaveAttribute("aria-busy", "true");
  });

  it("renders the back link only when given", () => {
    const { unmount } = setup();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    unmount();
    setup({ signInHref: "/login" });
    expect(
      screen.getByRole("link", { name: "Back to sign in" }),
    ).toHaveAttribute("href", "/login");
  });

  it("shows the confirmation with the submitted email once sent", async () => {
    const { rerender } = setup();
    await userEvent.type(email(), "ann@example.com");
    await userEvent.click(submit());

    rerender(<ForgotPasswordForm onSubmit={() => {}} isEmailSent />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Check your email" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("We sent a password reset link to ann@example.com."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("offers a resend with the same email", async () => {
    const onResend = vi.fn();
    const onSubmit = vi.fn();
    const { rerender } = render(
      <ForgotPasswordForm onSubmit={onSubmit} onResend={onResend} />,
    );
    await userEvent.type(email(), "ann@example.com");
    await userEvent.click(submit());

    rerender(
      <ForgotPasswordForm
        onSubmit={onSubmit}
        onResend={onResend}
        isEmailSent
        signInHref="/login"
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Resend email" }));
    expect(onResend).toHaveBeenCalledWith({ email: "ann@example.com" });
    expect(
      screen.getByRole("link", { name: "Back to sign in" }),
    ).toBeInTheDocument();
  });

  it("uses defaultEmail for the confirmation when the form was never typed in", () => {
    setup({ isEmailSent: true, defaultEmail: "ann@example.com" });
    expect(screen.getByText(/ann@example\.com/)).toBeInTheDocument();
  });

  it("accepts translated labels", () => {
    setup({ labels: { title: "Quên mật khẩu?", submit: "Gửi liên kết" } });
    expect(
      screen.getByRole("heading", { name: "Quên mật khẩu?" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Gửi liên kết" }),
    ).toBeInTheDocument();
  });

  it("receives ref on the form and, once sent, on the confirmation", () => {
    const ref = createRef<HTMLElement>();
    const { rerender } = setup({ ref });
    expect(ref.current).toBeInstanceOf(HTMLFormElement);
    rerender(<ForgotPasswordForm onSubmit={() => {}} ref={ref} isEmailSent />);
    expect(ref.current).toBe(screen.getByRole("status"));
  });

  it("has no accessibility violations in both states", async () => {
    const { container, rerender } = setup({ signInHref: "/login" });
    expect(await axe(container)).toHaveNoViolations();
    await userEvent.click(submit());
    expect(await axe(container)).toHaveNoViolations();

    rerender(
      <ForgotPasswordForm
        onSubmit={() => {}}
        onResend={() => {}}
        isEmailSent
        signInHref="/login"
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
