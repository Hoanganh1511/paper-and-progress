import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { Separator } from "./Separator";

expect.extend(toHaveNoViolations);

describe("Separator", () => {
  it("renders a horizontal subtle separator by default", () => {
    render(<Separator />);
    const el = screen.getByRole("separator");
    expect(el).toHaveAttribute("aria-orientation", "horizontal");
    expect(el).toHaveClass("h-px", "w-full", "bg-border-subtle");
  });

  it("renders a vertical separator", () => {
    render(<Separator orientation="vertical" />);
    const el = screen.getByRole("separator");
    expect(el).toHaveAttribute("aria-orientation", "vertical");
    expect(el).toHaveClass("w-px", "self-stretch");
  });

  it("renders each variant", () => {
    const variants = ["subtle", "strong"] as const;
    variants.forEach((variant) => {
      const { unmount } = render(<Separator variant={variant} />);
      expect(screen.getByRole("separator")).toHaveClass(`bg-border-${variant}`);
      unmount();
    });
  });

  it("receives ref via props", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Separator ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("merges custom className", () => {
    render(<Separator className="custom-class" />);
    expect(screen.getByRole("separator")).toHaveClass("custom-class");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <>
        <Separator />
        <Separator orientation="vertical" variant="strong" />
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
