import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { AuthSplash } from "./AuthSplash";

expect.extend(toHaveNoViolations);

describe("AuthSplash", () => {
  it("announces the default label through the spinner", () => {
    render(<AuthSplash />);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Đang kiểm tra phiên đăng nhập…",
    );
  });

  it("accepts a custom label and className", () => {
    const { container } = render(
      <AuthSplash label="Đang tải" className="custom-class" />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Đang tải");
    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<AuthSplash />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
