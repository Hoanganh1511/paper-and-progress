import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { MAIN_CONTENT_ID, SkipLink } from "./SkipLink";

expect.extend(toHaveNoViolations);

describe("SkipLink", () => {
  it("links to the main content and is hidden until focused", () => {
    render(<SkipLink />);
    const link = screen.getByRole("link", { name: "Skip to main content" });
    expect(link).toHaveAttribute("href", `#${MAIN_CONTENT_ID}`);
    expect(link).toHaveClass("sr-only", "focus:not-sr-only");
  });

  it("accepts a custom target and label", () => {
    render(<SkipLink href="#content">Bỏ qua điều hướng</SkipLink>);
    expect(
      screen.getByRole("link", { name: "Bỏ qua điều hướng" }),
    ).toHaveAttribute("href", "#content");
  });

  it("receives ref via props and merges className", () => {
    const ref = createRef<HTMLAnchorElement>();
    render(<SkipLink ref={ref} className="custom-class" />);
    expect(ref.current).toBe(screen.getByRole("link"));
    expect(ref.current).toHaveClass("custom-class");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <>
        <SkipLink />
        <main id={MAIN_CONTENT_ID}>Content</main>
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
