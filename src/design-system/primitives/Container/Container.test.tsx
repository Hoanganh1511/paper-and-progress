import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { Container } from "./Container";

expect.extend(toHaveNoViolations);

describe("Container", () => {
  it("renders a centered default-size container with responsive padding", () => {
    render(<Container>Test</Container>);
    expect(screen.getByText("Test")).toHaveClass(
      "mx-auto",
      "w-full",
      "px-4",
      "sm:px-6",
      "lg:px-8",
      "max-w-[var(--width-container-default)]",
    );
  });

  it("applies each size", () => {
    const expected = {
      narrow: "max-w-[var(--width-container-narrow)]",
      default: "max-w-[var(--width-container-default)]",
      wide: "max-w-[var(--width-container-wide)]",
      full: "max-w-full",
    } as const;
    (Object.keys(expected) as (keyof typeof expected)[]).forEach((size) => {
      const { unmount } = render(<Container size={size}>Test</Container>);
      expect(screen.getByText("Test")).toHaveClass(expected[size]);
      unmount();
    });
  });

  it("receives ref via props", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Container ref={ref}>Test</Container>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("merges custom className", () => {
    render(<Container className="custom-class">Test</Container>);
    expect(screen.getByText("Test")).toHaveClass("custom-class");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <Container>
        <p>Content</p>
      </Container>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
