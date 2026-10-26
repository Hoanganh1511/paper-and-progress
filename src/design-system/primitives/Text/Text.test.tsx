import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { Text } from "./Text";

expect.extend(toHaveNoViolations);

describe("Text", () => {
  it("renders a paragraph by default", () => {
    render(<Text>Hello</Text>);
    expect(screen.getByText("Hello").tagName).toBe("P");
  });

  it("renders the element given by `as`", () => {
    const tags = [
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "p",
      "span",
      "label",
      "blockquote",
    ] as const;
    tags.forEach((tag) => {
      const { unmount } = render(<Text as={tag}>Test</Text>);
      expect(screen.getByText("Test").tagName).toBe(tag.toUpperCase());
      unmount();
    });
  });

  it("renders each size", () => {
    const sizes = [
      "display-xl",
      "display-lg",
      "heading-xl",
      "heading-lg",
      "heading-md",
      "heading-sm",
      "body-lg",
      "body-md",
      "body-sm",
      "caption",
      "overline",
    ] as const;
    sizes.forEach((size) => {
      const { unmount } = render(<Text size={size}>Test</Text>);
      expect(screen.getByText("Test")).toHaveClass(`text-${size}`);
      unmount();
    });
  });

  it("applies weight and color", () => {
    render(
      <Text weight="bold" color="danger">
        Test
      </Text>,
    );
    const el = screen.getByText("Test");
    expect(el).toHaveClass("font-bold");
    expect(el).toHaveClass("text-danger-text");
  });

  it("defaults to regular weight and primary color", () => {
    render(<Text>Test</Text>);
    const el = screen.getByText("Test");
    expect(el).toHaveClass("font-normal");
    expect(el).toHaveClass("text-text-primary");
  });

  it("uses font-display for display and heading sizes", () => {
    const sizes = [
      "display-xl",
      "display-lg",
      "heading-xl",
      "heading-sm",
    ] as const;
    sizes.forEach((size) => {
      const { unmount } = render(<Text size={size}>Test</Text>);
      expect(screen.getByText("Test")).toHaveClass("font-display");
      unmount();
    });
  });

  it("uses font-body for body, caption and overline sizes", () => {
    const sizes = [
      "body-lg",
      "body-md",
      "body-sm",
      "caption",
      "overline",
    ] as const;
    sizes.forEach((size) => {
      const { unmount } = render(<Text size={size}>Test</Text>);
      expect(screen.getByText("Test")).toHaveClass("font-body");
      unmount();
    });
  });

  it("lets the font prop override the default", () => {
    render(
      <Text size="heading-md" font="handwritten">
        Test
      </Text>,
    );
    const el = screen.getByText("Test");
    expect(el).toHaveClass("font-handwritten");
    expect(el).not.toHaveClass("font-display");
  });

  it("applies alignment", () => {
    render(<Text align="center">Test</Text>);
    expect(screen.getByText("Test")).toHaveClass("text-center");
  });

  it("truncates when truncate is set", () => {
    render(<Text truncate>Test</Text>);
    expect(screen.getByText("Test")).toHaveClass("truncate");
  });

  it("receives ref via props", () => {
    const ref = createRef<HTMLElement>();
    render(<Text ref={ref}>Test</Text>);
    expect(ref.current).toBeInstanceOf(HTMLElement);
  });

  it("merges custom className", () => {
    render(<Text className="custom-class">Test</Text>);
    expect(screen.getByText("Test")).toHaveClass("custom-class");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <>
        <Text as="h1" size="display-lg">
          Title
        </Text>
        <Text>Body</Text>
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
