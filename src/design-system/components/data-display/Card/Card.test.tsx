import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { Card, CardContent, CardFooter, CardHeader } from "./index";

expect.extend(toHaveNoViolations);

describe("Card", () => {
  it("renders a default div with default padding", () => {
    render(<Card>Test</Card>);
    const el = screen.getByText("Test");
    expect(el.tagName).toBe("DIV");
    expect(el).toHaveClass("bg-surface-card", "border-border-subtle", "p-6");
  });

  it("renders the element given by `as`", () => {
    const tags = ["div", "article", "section", "li"] as const;
    tags.forEach((tag) => {
      const { container, unmount } = render(<Card as={tag}>x</Card>);
      expect(container.firstElementChild?.tagName).toBe(tag.toUpperCase());
      unmount();
    });
  });

  it("renders each variant", () => {
    const expected = {
      default: "border-border-subtle",
      outlined: "border-border-strong",
      elevated: "shadow-floating",
      accent: "shadow-accent",
    } as const;
    (Object.keys(expected) as (keyof typeof expected)[]).forEach((variant) => {
      const { unmount } = render(<Card variant={variant}>Test</Card>);
      expect(screen.getByText("Test")).toHaveClass(expected[variant]);
      unmount();
    });
  });

  it("applies each padding", () => {
    const expected = { none: "p-0", compact: "p-4", default: "p-6" } as const;
    (Object.keys(expected) as (keyof typeof expected)[]).forEach((padding) => {
      const { unmount } = render(<Card padding={padding}>Test</Card>);
      expect(screen.getByText("Test")).toHaveClass(expected[padding]);
      unmount();
    });
  });

  it("adds hover and focus-within styling only when interactive", () => {
    const { rerender } = render(<Card>Test</Card>);
    expect(screen.getByText("Test").className).not.toContain("hover:");
    rerender(<Card interactive>Test</Card>);
    expect(screen.getByText("Test")).toHaveClass(
      "cursor-pointer",
      "hover:-translate-y-0.5",
      "focus-within:outline-2",
      "motion-reduce:hover:translate-y-0",
    );
  });

  it("renders header, content and footer sections", () => {
    render(
      <Card>
        <CardHeader>Header</CardHeader>
        <CardContent>Content</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>,
    );
    expect(screen.getByText("Header")).toHaveClass("flex-col");
    expect(screen.getByText("Content")).toHaveClass("flex-1");
    expect(screen.getByText("Footer")).toHaveClass("flex", "items-center");
  });

  it("receives ref via props on every part", () => {
    const refs = {
      card: createRef<HTMLElement>(),
      header: createRef<HTMLDivElement>(),
      content: createRef<HTMLDivElement>(),
      footer: createRef<HTMLDivElement>(),
    };
    render(
      <Card ref={refs.card}>
        <CardHeader ref={refs.header}>H</CardHeader>
        <CardContent ref={refs.content}>C</CardContent>
        <CardFooter ref={refs.footer}>F</CardFooter>
      </Card>,
    );
    Object.values(refs).forEach((ref) => {
      expect(ref.current).toBeInstanceOf(HTMLElement);
    });
  });

  it("merges custom className on every part", () => {
    render(
      <Card className="card-class">
        <CardHeader className="header-class">H</CardHeader>
        <CardContent className="content-class">C</CardContent>
        <CardFooter className="footer-class">F</CardFooter>
      </Card>,
    );
    expect(screen.getByText("H").closest(".card-class")).toBeInTheDocument();
    expect(screen.getByText("H")).toHaveClass("header-class");
    expect(screen.getByText("C")).toHaveClass("content-class");
    expect(screen.getByText("F")).toHaveClass("footer-class");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <>
        <Card as="article" variant="accent" interactive>
          <CardHeader>
            <h3>Title</h3>
          </CardHeader>
          <CardContent>Body</CardContent>
          <CardFooter>
            <a href="/more">Read more</a>
          </CardFooter>
        </Card>
        <ul>
          <Card as="li">Item</Card>
        </ul>
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
