import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import {
  FocusRing,
  focusRingClasses,
  focusRingWithinClasses,
} from "./FocusRing";

expect.extend(toHaveNoViolations);

describe("FocusRing", () => {
  it("exports focus-visible classes", () => {
    expect(focusRingClasses).toContain("focus-visible:outline-2");
    expect(focusRingClasses).toContain("focus-visible:outline-solid");
    expect(focusRingClasses).toContain("focus-visible:outline-border-focus");
    expect(focusRingClasses).toContain("focus-visible:outline-offset-2");
  });

  it("exports focus-within classes", () => {
    expect(focusRingWithinClasses).toContain("focus-within:outline-2");
    expect(focusRingWithinClasses).toContain("focus-within:outline-solid");
    expect(focusRingWithinClasses).toContain(
      "focus-within:outline-border-focus",
    );
    expect(focusRingWithinClasses).toContain("focus-within:outline-offset-2");
  });

  it("uses focus-visible by default", () => {
    render(<FocusRing>Test</FocusRing>);
    const el = screen.getByText("Test");
    expect(el).toHaveClass("focus-visible:outline-2");
    expect(el.className).not.toContain("focus-within:");
  });

  it("uses focus-within when within is set", () => {
    render(<FocusRing within>Test</FocusRing>);
    const el = screen.getByText("Test");
    expect(el).toHaveClass("focus-within:outline-2");
    expect(el.className).not.toContain("focus-visible:");
  });

  it("receives ref via props", () => {
    const ref = createRef<HTMLDivElement>();
    render(<FocusRing ref={ref}>Test</FocusRing>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("merges custom className", () => {
    render(<FocusRing className="custom-class">Test</FocusRing>);
    expect(screen.getByText("Test")).toHaveClass("custom-class");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <FocusRing within>
        <button type="button">Action</button>
      </FocusRing>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
