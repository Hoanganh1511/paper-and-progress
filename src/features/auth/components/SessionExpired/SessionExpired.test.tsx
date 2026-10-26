import { createRef } from "react";
import { vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { SessionExpired } from "./SessionExpired";

expect.extend(toHaveNoViolations);

describe("SessionExpired", () => {
  it("renders an alert with a hidden icon, an h1 title and a description", () => {
    const { container } = render(<SessionExpired onSignIn={() => {}} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(container.querySelector("svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Your session has expired",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/signed out after a period of inactivity/),
    ).toBeInTheDocument();
  });

  it("calls onSignIn from the button", async () => {
    const onSignIn = vi.fn();
    render(<SessionExpired onSignIn={onSignIn} />);
    await userEvent.click(
      screen.getByRole("button", { name: "Sign in again" }),
    );
    expect(onSignIn).toHaveBeenCalledTimes(1);
  });

  it("renders a link when signInHref is given", () => {
    render(<SessionExpired signInHref="/login" signInLabel="Đăng nhập lại" />);
    expect(screen.getByRole("link", { name: "Đăng nhập lại" })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders no action without onSignIn or signInHref", () => {
    render(<SessionExpired />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("accepts a custom title, description and heading level", () => {
    render(
      <SessionExpired
        title="Phiên đã hết hạn"
        description="Vui lòng đăng nhập lại."
        titleAs="h2"
      />,
    );
    expect(
      screen.getByRole("heading", { level: 2, name: "Phiên đã hết hạn" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Vui lòng đăng nhập lại.")).toBeInTheDocument();
  });

  it("receives ref via props and merges className", () => {
    const ref = createRef<HTMLDivElement>();
    render(<SessionExpired ref={ref} className="custom-class" />);
    expect(ref.current).toBe(screen.getByRole("alert"));
    expect(ref.current).toHaveClass("custom-class");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<SessionExpired onSignIn={() => {}} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
