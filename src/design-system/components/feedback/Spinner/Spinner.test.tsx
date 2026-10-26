import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { Spinner } from "./Spinner";

expect.extend(toHaveNoViolations);

describe("Spinner", () => {
  it("renders a status region announcing Loading by default", () => {
    render(<Spinner />);
    // A status region exposes its text content rather than a name.
    expect(screen.getByRole("status")).toHaveTextContent("Loading");
  });

  it("supports a custom label", () => {
    render(<Spinner label="Saving changes" />);
    expect(screen.getByRole("status")).toHaveTextContent("Saving changes");
  });

  it("renders each size", () => {
    const expected = {
      sm: "size-4",
      md: "size-6",
      lg: "size-8",
      xl: "size-12",
    } as const;
    (Object.keys(expected) as (keyof typeof expected)[]).forEach((size) => {
      const { unmount } = render(<Spinner size={size} />);
      expect(screen.getByRole("status")).toHaveClass(expected[size]);
      unmount();
    });
  });

  it("defaults to md", () => {
    render(<Spinner />);
    expect(screen.getByRole("status")).toHaveClass("size-6");
  });

  it("spins a hidden icon, and stops when reduced motion is preferred", () => {
    render(<Spinner />);
    const icon = screen.getByRole("status").querySelector("svg");
    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(icon).toHaveClass("animate-spin", "motion-reduce:animate-none");
  });

  it("receives ref via props and merges className", () => {
    const ref = createRef<HTMLSpanElement>();
    render(<Spinner ref={ref} className="custom-class" />);
    expect(ref.current).toBe(screen.getByRole("status"));
    expect(screen.getByRole("status")).toHaveClass("custom-class");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Spinner size="lg" label="Loading results" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
