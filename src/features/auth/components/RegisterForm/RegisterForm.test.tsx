import { createRef } from "react";
import { vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { RegisterForm, type RegisterFormProps } from "./RegisterForm";

expect.extend(toHaveNoViolations);

function setup(props: Partial<RegisterFormProps> = {}) {
  const onSubmit = vi.fn();
  const view = render(<RegisterForm onSubmit={onSubmit} {...props} />);
  return { onSubmit, ...view };
}

const name = () => screen.getByLabelText(/Full name/);
const email = () => screen.getByLabelText(/Email/);
const password = () =>
  screen.getByLabelText(/^Password/, { selector: "input" });
const confirm = () =>
  screen.getByLabelText(/Confirm password/, { selector: "input" });
const terms = () => screen.getByRole("checkbox");
const submit = () => screen.getByRole("button", { name: "Create account" });

async function fillValid(
  overrides: { confirm?: string; terms?: boolean } = {},
) {
  await userEvent.type(name(), "Ann Nguyen");
  await userEvent.type(email(), "ann@example.com");
  await userEvent.type(password(), "supersecret");
  await userEvent.type(confirm(), overrides.confirm ?? "supersecret");
  if (overrides.terms ?? true) await userEvent.click(terms());
}

describe("RegisterForm", () => {
  it("renders a labelled form with every field", () => {
    setup();
    expect(
      screen.getByRole("form", { name: "Create your account" }),
    ).toBeInTheDocument();
    expect(name()).toHaveAttribute("autocomplete", "name");
    expect(email()).toHaveAttribute("type", "email");
    expect(password()).toHaveAttribute("autocomplete", "new-password");
    expect(confirm()).toHaveAttribute("autocomplete", "new-password");
    expect(screen.getByText("At least 8 characters.")).toBeInTheDocument();
    expect(terms()).toBeInTheDocument();
  });

  it("submits name, email and password when everything is valid", async () => {
    const { onSubmit } = setup();
    await fillValid();
    await userEvent.click(submit());
    expect(onSubmit).toHaveBeenCalledWith({
      name: "Ann Nguyen",
      email: "ann@example.com",
      password: "supersecret",
    });
  });

  it("reports every missing field and focuses the first", async () => {
    const { onSubmit } = setup();
    await userEvent.click(submit());
    expect(onSubmit).not.toHaveBeenCalled();
    [
      "Enter your name.",
      "Enter your email.",
      "Choose a password.",
      "Confirm your password.",
      "You need to accept the terms to continue.",
    ].forEach((message) =>
      expect(screen.getByText(message)).toBeInTheDocument(),
    );
    expect(name()).toHaveFocus();
  });

  it("rejects short passwords, using the configured minimum", async () => {
    const { onSubmit } = setup({ minPasswordLength: 10 });
    expect(screen.getByText("At least 10 characters.")).toBeInTheDocument();
    await userEvent.type(name(), "Ann");
    await userEvent.type(email(), "ann@example.com");
    await userEvent.type(password(), "short");
    await userEvent.type(confirm(), "short");
    await userEvent.click(terms());
    await userEvent.click(submit());
    expect(screen.getByText("Use at least 10 characters.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("rejects mismatched passwords", async () => {
    const { onSubmit } = setup();
    await fillValid({ confirm: "different" });
    await userEvent.click(submit());
    expect(screen.getByText("The passwords do not match.")).toBeInTheDocument();
    expect(confirm()).toHaveAttribute("aria-invalid", "true");
    expect(confirm()).toHaveFocus();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("requires the terms and links the error to the checkbox", async () => {
    const { onSubmit } = setup();
    await fillValid({ terms: false });
    await userEvent.click(submit());
    expect(terms()).toHaveAttribute("aria-invalid", "true");
    const message = screen.getByText(
      "You need to accept the terms to continue.",
    );
    expect(terms()).toHaveAttribute("aria-describedby", message.id);
    expect(onSubmit).not.toHaveBeenCalled();

    await userEvent.click(terms());
    expect(
      screen.queryByText("You need to accept the terms to continue."),
    ).not.toBeInTheDocument();
  });

  it("shows server errors from props", () => {
    setup({
      error: "Something went wrong",
      errors: { email: "Email already in use" },
    });
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Email already in use")).toBeInTheDocument();
    expect(email()).toHaveAttribute("aria-invalid", "true");
  });

  it("renders the sign-in link only when given", () => {
    const { unmount } = setup();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    unmount();
    setup({ signInHref: "/login" });
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("disables the fields and shows a busy button while submitting", () => {
    setup({ isSubmitting: true });
    [name(), email(), password(), confirm(), terms()].forEach((field) =>
      expect(field).toBeDisabled(),
    );
    expect(submit()).toHaveAttribute("aria-busy", "true");
  });

  it("accepts translated labels", () => {
    setup({
      labels: { title: "Tạo tài khoản", submit: "Đăng ký", name: "Họ tên" },
    });
    expect(
      screen.getByRole("heading", { name: "Tạo tài khoản" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Họ tên/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Đăng ký" })).toBeInTheDocument();
  });

  it("receives ref via props", () => {
    const ref = createRef<HTMLFormElement>();
    setup({ ref });
    expect(ref.current).toBeInstanceOf(HTMLFormElement);
  });

  it("has no accessibility violations", async () => {
    const { container } = setup({ signInHref: "/login" });
    expect(await axe(container)).toHaveNoViolations();
    await userEvent.click(submit());
    expect(await axe(container)).toHaveNoViolations();
  });
});
