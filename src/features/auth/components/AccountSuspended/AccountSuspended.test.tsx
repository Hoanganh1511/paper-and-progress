import { createRef } from "react";
import { vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { AccountSuspended } from "./AccountSuspended";

expect.extend(toHaveNoViolations);

describe("AccountSuspended", () => {
  it("renders an alert with an h1 title and a description", () => {
    render(<AccountSuspended onLogout={() => {}} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "Tài khoản đã bị khoá" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/liên hệ admin/)).toBeInTheDocument();
  });

  it("calls onLogout from the button", async () => {
    const onLogout = vi.fn();
    render(<AccountSuspended onLogout={onLogout} />);
    await userEvent.click(screen.getByRole("button", { name: "Đăng xuất" }));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it("receives ref via props and merges className", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <AccountSuspended
        ref={ref}
        className="custom-class"
        onLogout={() => {}}
      />,
    );
    expect(ref.current).toBe(screen.getByRole("alert"));
    expect(ref.current).toHaveClass("custom-class");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<AccountSuspended onLogout={() => {}} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
