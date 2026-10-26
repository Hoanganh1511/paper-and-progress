import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { Alert } from "./Alert";

expect.extend(toHaveNoViolations);

describe("Alert", () => {
  it("renders a title and a message", () => {
    render(<Alert title="Heads up">Something changed</Alert>);
    const el = screen.getByRole("status");
    expect(el).toHaveTextContent("Heads up");
    expect(el).toHaveTextContent("Something changed");
  });

  it("renders each variant with its own hidden icon", () => {
    const expected = {
      info: ["bg-info-bg", "lucide-info"],
      success: ["bg-success-bg", "lucide-circle-check"],
      warning: ["bg-warning-bg", "lucide-triangle-alert"],
      danger: ["bg-danger-bg", "lucide-circle-alert"],
    } as const;
    (Object.keys(expected) as (keyof typeof expected)[]).forEach((variant) => {
      const { container, unmount } = render(
        <Alert variant={variant}>Message</Alert>,
      );
      const [background, iconClass] = expected[variant];
      expect(container.firstElementChild).toHaveClass(background);
      const icon = container.querySelector("svg");
      expect(icon).toHaveAttribute("aria-hidden", "true");
      expect(icon).toHaveClass(iconClass);
      unmount();
    });
  });

  it("uses role=alert for danger and warning, role=status otherwise", () => {
    const roles = {
      info: "status",
      success: "status",
      warning: "alert",
      danger: "alert",
    } as const;
    (Object.keys(roles) as (keyof typeof roles)[]).forEach((variant) => {
      const { container, unmount } = render(<Alert variant={variant}>x</Alert>);
      expect(container.firstElementChild).toHaveAttribute(
        "role",
        roles[variant],
      );
      unmount();
    });
  });

  it("lets the role be overridden", () => {
    render(
      <Alert variant="danger" role="status">
        x
      </Alert>,
    );
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("receives ref via props and merges className", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Alert ref={ref} className="custom-class">
        x
      </Alert>,
    );
    expect(ref.current).toBe(screen.getByRole("status"));
    expect(ref.current).toHaveClass("custom-class");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <>
        <Alert title="Saved">Done</Alert>
        <Alert variant="danger" title="Failed">
          Try again
        </Alert>
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
