import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { AuthFormHeader } from "./AuthFormHeader";
import { FormError } from "./FormError";
import { authLinkClasses } from "./authLinkClasses";

expect.extend(toHaveNoViolations);

describe("AuthFormHeader", () => {
  it("renders an h1 with an optional description and id", () => {
    render(
      <AuthFormHeader title="Sign in" description="Welcome back" titleId="t" />,
    );
    const heading = screen.getByRole("heading", { level: 1, name: "Sign in" });
    expect(heading).toHaveAttribute("id", "t");
    expect(screen.getByText("Welcome back")).toBeInTheDocument();
  });

  it("works without a description", () => {
    render(<AuthFormHeader title="Sign in" />);
    expect(
      screen.getByRole("heading", { name: "Sign in" }),
    ).toBeInTheDocument();
  });
});

describe("FormError", () => {
  it("renders an alert with a hidden icon", () => {
    render(<FormError className="custom-class">Wrong password</FormError>);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Wrong password");
    expect(alert).toHaveClass("custom-class");
    expect(alert.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <>
        <AuthFormHeader title="Sign in" description="Welcome back" />
        <FormError>Wrong password</FormError>
        <a href="/x" className={authLinkClasses}>
          Link
        </a>
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
