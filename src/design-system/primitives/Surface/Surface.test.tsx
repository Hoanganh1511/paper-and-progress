import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { Surface } from "./Surface";

expect.extend(toHaveNoViolations);

describe("Surface", () => {
  it("renders a div with card defaults", () => {
    render(<Surface>Test</Surface>);
    const el = screen.getByText("Test");
    expect(el.tagName).toBe("DIV");
    expect(el).toHaveClass(
      "bg-surface-card",
      "p-6",
      "rounded-standard",
      "shadow-flat",
      "border-0",
    );
  });

  it("renders the element given by `as`", () => {
    const tags = [
      "div",
      "section",
      "article",
      "aside",
      "main",
      "header",
      "footer",
      "nav",
    ] as const;
    tags.forEach((tag) => {
      const { unmount } = render(<Surface as={tag}>Test</Surface>);
      expect(screen.getByText("Test").tagName).toBe(tag.toUpperCase());
      unmount();
    });
  });

  it("renders each variant", () => {
    const variants = ["page", "card", "overlay", "sunken"] as const;
    variants.forEach((variant) => {
      const { unmount } = render(<Surface variant={variant}>Test</Surface>);
      expect(screen.getByText("Test")).toHaveClass(`bg-surface-${variant}`);
      unmount();
    });
  });

  it("applies padding", () => {
    const map = {
      none: "p-0",
      compact: "p-3",
      default: "p-6",
      spacious: "p-8",
    };
    (Object.keys(map) as (keyof typeof map)[]).forEach((padding) => {
      const { unmount } = render(<Surface padding={padding}>Test</Surface>);
      expect(screen.getByText("Test")).toHaveClass(map[padding]);
      unmount();
    });
  });

  it("applies radius", () => {
    const radii = ["none", "sharp", "standard", "soft"] as const;
    radii.forEach((radius) => {
      const { unmount } = render(<Surface radius={radius}>Test</Surface>);
      expect(screen.getByText("Test")).toHaveClass(`rounded-${radius}`);
      unmount();
    });
  });

  it("applies elevation", () => {
    const levels = ["flat", "raised", "floating", "modal", "accent"] as const;
    levels.forEach((elevation) => {
      const { unmount } = render(<Surface elevation={elevation}>Test</Surface>);
      expect(screen.getByText("Test")).toHaveClass(`shadow-${elevation}`);
      unmount();
    });
  });

  it("applies border", () => {
    const { rerender } = render(<Surface border="subtle">Test</Surface>);
    expect(screen.getByText("Test")).toHaveClass("border-border-subtle");
    rerender(<Surface border="strong">Test</Surface>);
    expect(screen.getByText("Test")).toHaveClass("border-border-strong");
  });

  it("receives ref via props", () => {
    const ref = createRef<HTMLElement>();
    render(<Surface ref={ref}>Test</Surface>);
    expect(ref.current).toBeInstanceOf(HTMLElement);
  });

  it("merges custom className", () => {
    render(<Surface className="custom-class">Test</Surface>);
    expect(screen.getByText("Test")).toHaveClass("custom-class");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <Surface as="section" aria-label="Section">
        Content
      </Surface>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
