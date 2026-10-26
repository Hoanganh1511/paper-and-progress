import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { Inline } from "./Inline";

expect.extend(toHaveNoViolations);

describe("Inline", () => {
  it("renders a wrapping row with defaults", () => {
    render(<Inline>Test</Inline>);
    const el = screen.getByText("Test");
    expect(el.tagName).toBe("DIV");
    expect(el).toHaveClass(
      "flex",
      "flex-row",
      "flex-wrap",
      "gap-2",
      "items-center",
      "justify-start",
    );
  });

  it("renders the element given by `as`", () => {
    const tags = ["div", "nav", "ul"] as const;
    tags.forEach((tag) => {
      const { container, unmount } = render(<Inline as={tag}>x</Inline>);
      expect(container.firstElementChild?.tagName).toBe(tag.toUpperCase());
      unmount();
    });
  });

  it("applies each gap", () => {
    const gaps = [1, 2, 3, 4, 5, 6, 8] as const;
    gaps.forEach((gap) => {
      const { unmount } = render(<Inline gap={gap}>Test</Inline>);
      expect(screen.getByText("Test")).toHaveClass(`gap-${gap}`);
      unmount();
    });
  });

  it("applies each align", () => {
    const aligns = ["start", "center", "end", "baseline"] as const;
    aligns.forEach((align) => {
      const { unmount } = render(<Inline align={align}>Test</Inline>);
      expect(screen.getByText("Test")).toHaveClass(`items-${align}`);
      unmount();
    });
  });

  it("applies each justify", () => {
    const justifies = ["start", "center", "end", "between"] as const;
    justifies.forEach((justify) => {
      const { unmount } = render(<Inline justify={justify}>Test</Inline>);
      expect(screen.getByText("Test")).toHaveClass(`justify-${justify}`);
      unmount();
    });
  });

  it("disables wrapping when wrap is false", () => {
    render(<Inline wrap={false}>Test</Inline>);
    const el = screen.getByText("Test");
    expect(el).toHaveClass("flex-nowrap");
    expect(el).not.toHaveClass("flex-wrap");
  });

  it("receives ref via props", () => {
    const ref = createRef<HTMLElement>();
    render(<Inline ref={ref}>Test</Inline>);
    expect(ref.current).toBeInstanceOf(HTMLElement);
  });

  it("merges custom className", () => {
    render(<Inline className="custom-class">Test</Inline>);
    expect(screen.getByText("Test")).toHaveClass("custom-class");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <Inline as="ul">
        <li>One</li>
        <li>Two</li>
      </Inline>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
