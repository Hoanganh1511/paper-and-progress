import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { Stack } from "./Stack";

expect.extend(toHaveNoViolations);

describe("Stack", () => {
  it("renders a vertical div with default gap and align", () => {
    render(<Stack>Test</Stack>);
    const el = screen.getByText("Test");
    expect(el.tagName).toBe("DIV");
    expect(el).toHaveClass("flex", "flex-col", "gap-4", "items-stretch");
  });

  it("renders the element given by `as`", () => {
    const tags = ["div", "section", "ul", "ol", "nav", "form"] as const;
    tags.forEach((tag) => {
      const { container, unmount } = render(<Stack as={tag}>x</Stack>);
      expect(container.firstElementChild?.tagName).toBe(tag.toUpperCase());
      unmount();
    });
  });

  it("applies each gap", () => {
    const gaps = [1, 2, 3, 4, 5, 6, 8, 12, 16, 24] as const;
    gaps.forEach((gap) => {
      const { unmount } = render(<Stack gap={gap}>Test</Stack>);
      expect(screen.getByText("Test")).toHaveClass(`gap-${gap}`);
      unmount();
    });
  });

  it("applies each align", () => {
    const aligns = ["start", "center", "end", "stretch"] as const;
    aligns.forEach((align) => {
      const { unmount } = render(<Stack align={align}>Test</Stack>);
      expect(screen.getByText("Test")).toHaveClass(`items-${align}`);
      unmount();
    });
  });

  it("receives ref via props", () => {
    const ref = createRef<HTMLElement>();
    render(<Stack ref={ref}>Test</Stack>);
    expect(ref.current).toBeInstanceOf(HTMLElement);
  });

  it("merges custom className", () => {
    render(<Stack className="custom-class">Test</Stack>);
    expect(screen.getByText("Test")).toHaveClass("custom-class");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <Stack as="ul">
        <li>One</li>
        <li>Two</li>
      </Stack>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
