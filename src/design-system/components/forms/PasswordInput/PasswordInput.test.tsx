import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { FormField } from "../FormField";
import { PasswordInput } from "./PasswordInput";

expect.extend(toHaveNoViolations);

describe("PasswordInput", () => {
  it("hides the password by default", () => {
    render(<PasswordInput aria-label="Password" />);
    expect(
      screen.getByLabelText("Password", { selector: "input" }),
    ).toHaveAttribute("type", "password");
    expect(
      screen.getByRole("button", { name: "Show password" }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("toggles visibility", async () => {
    render(<PasswordInput aria-label="Password" />);
    const input = screen.getByLabelText("Password", { selector: "input" });
    const toggle = screen.getByRole("button", { name: "Show password" });

    await userEvent.click(toggle);
    expect(input).toHaveAttribute("type", "text");
    expect(toggle).toHaveAttribute("aria-pressed", "true");

    await userEvent.click(toggle);
    expect(input).toHaveAttribute("type", "password");
  });

  it("keeps the typed value when toggling", async () => {
    render(<PasswordInput aria-label="Password" />);
    const input = screen.getByLabelText("Password", { selector: "input" });
    await userEvent.type(input, "secret");
    await userEvent.click(
      screen.getByRole("button", { name: "Show password" }),
    );
    expect(input).toHaveValue("secret");
  });

  it("uses a custom toggle label", () => {
    render(<PasswordInput aria-label="Mật khẩu" toggleLabel="Hiện mật khẩu" />);
    expect(
      screen.getByRole("button", { name: "Hiện mật khẩu" }),
    ).toBeInTheDocument();
  });

  it("disables the toggle with the input", () => {
    render(<PasswordInput aria-label="Password" disabled />);
    expect(
      screen.getByRole("button", { name: "Show password" }),
    ).toBeDisabled();
  });

  it("reads FormField context", () => {
    render(
      <FormField label="Password" error="Too short">
        <PasswordInput />
      </FormField>,
    );
    expect(
      screen.getByLabelText("Password", { selector: "input" }),
    ).toHaveAttribute("aria-invalid", "true");
  });

  it("receives ref on the input", () => {
    const ref = createRef<HTMLInputElement>();
    render(<PasswordInput aria-label="Password" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <FormField label="Password" description="At least 8 characters">
        <PasswordInput />
      </FormField>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
