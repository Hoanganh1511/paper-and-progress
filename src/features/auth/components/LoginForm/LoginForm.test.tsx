import { createRef } from "react";
import { vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { LoginForm, type LoginFormProps } from "./LoginForm";

expect.extend(toHaveNoViolations);

function setup(props: Partial<LoginFormProps> = {}) {
  const onSubmit = vi.fn();
  const view = render(<LoginForm onSubmit={onSubmit} {...props} />);
  return { onSubmit, ...view };
}

const email = () => screen.getByLabelText(/Email/);
const password = () => screen.getByLabelText(/Password/, { selector: "input" });
const submit = () => screen.getByRole("button", { name: "Sign in" });

describe("LoginForm", () => {
  it("renders a labelled form with the title, fields and submit button", () => {
    setup();
    expect(screen.getByRole("form", { name: "Sign in" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "Sign in" }),
    ).toBeInTheDocument();
    expect(email()).toHaveAttribute("type", "email");
    expect(email()).toHaveAttribute("autocomplete", "email");
    expect(password()).toHaveAttribute("type", "password");
    expect(password()).toHaveAttribute("autocomplete", "current-password");
    expect(
      screen.getByRole("checkbox", { name: "Remember me" }),
    ).toBeInTheDocument();
    expect(submit()).toHaveAttribute("type", "submit");
  });

  it("submits the values", async () => {
    const { onSubmit } = setup();
    await userEvent.type(email(), "  ann@example.com ");
    await userEvent.type(password(), "secret");
    await userEvent.click(
      screen.getByRole("checkbox", { name: "Remember me" }),
    );
    await userEvent.click(submit());
    expect(onSubmit).toHaveBeenCalledWith({
      email: "ann@example.com",
      password: "secret",
      rememberMe: true,
    });
  });

  it("submits with Enter and reports rememberMe false by default", async () => {
    const { onSubmit } = setup();
    await userEvent.type(email(), "ann@example.com");
    await userEvent.type(password(), "secret{Enter}");
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ rememberMe: false }),
    );
  });

  it("shows required errors, focuses the first invalid field and does not submit", async () => {
    const { onSubmit } = setup();
    await userEvent.click(submit());
    expect(onSubmit).not.toHaveBeenCalled();
    expect(
      screen.getAllByRole("alert").map((alert) => alert.textContent),
    ).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Enter your email."),
        expect.stringContaining("Enter your password."),
      ]),
    );
    expect(email()).toHaveAttribute("aria-invalid", "true");
    expect(email()).toHaveFocus();
  });

  it("rejects a malformed email and clears the error when the field changes", async () => {
    const { onSubmit } = setup();
    await userEvent.type(email(), "ann");
    await userEvent.type(password(), "secret");
    await userEvent.click(submit());
    expect(
      screen.getByText("Enter a valid email address."),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();

    await userEvent.type(email(), "@example.com");
    expect(
      screen.queryByText("Enter a valid email address."),
    ).not.toBeInTheDocument();
  });

  it("shows server errors from props", () => {
    setup({
      error: "Wrong email or password",
      errors: { email: "No account with this email" },
    });
    expect(screen.getByText("Wrong email or password")).toBeInTheDocument();
    expect(screen.getByText("No account with this email")).toBeInTheDocument();
    expect(email()).toHaveAttribute("aria-invalid", "true");
  });

  it("prefills the email and renders the links when given", () => {
    setup({
      defaultEmail: "ann@example.com",
      forgotPasswordHref: "/forgot",
      signUpHref: "/register",
    });
    expect(email()).toHaveValue("ann@example.com");
    expect(
      screen.getByRole("link", { name: "Forgot password?" }),
    ).toHaveAttribute("href", "/forgot");
    expect(screen.getByRole("link", { name: "Sign up" })).toHaveAttribute(
      "href",
      "/register",
    );
  });

  it("omits the links when no href is given", () => {
    setup();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("disables the fields and shows a busy button while submitting", () => {
    setup({ isSubmitting: true });
    expect(email()).toBeDisabled();
    expect(password()).toBeDisabled();
    expect(submit()).toHaveAttribute("aria-busy", "true");
  });

  it("accepts translated labels", () => {
    setup({
      labels: { title: "Đăng nhập", submit: "Vào", email: "Thư điện tử" },
    });
    expect(
      screen.getByRole("heading", { name: "Đăng nhập" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Thư điện tử/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Vào" })).toBeInTheDocument();
  });

  it("receives ref via props", () => {
    const ref = createRef<HTMLFormElement>();
    setup({ ref });
    expect(ref.current).toBeInstanceOf(HTMLFormElement);
  });

  it("has no accessibility violations", async () => {
    const { container } = setup({
      forgotPasswordHref: "/forgot",
      signUpHref: "/register",
      error: "Wrong email or password",
    });
    expect(await axe(container)).toHaveNoViolations();
    await userEvent.click(submit());
    expect(await axe(container)).toHaveNoViolations();
  });
});
