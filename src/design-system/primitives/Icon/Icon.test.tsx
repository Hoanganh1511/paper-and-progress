import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { Star } from "lucide-react";
import { Icon } from "./Icon";

expect.extend(toHaveNoViolations);

describe("Icon", () => {
  it("renders the given icon at default size and color", () => {
    const { container } = render(<Icon icon={Star} />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("width", "20");
    expect(svg).toHaveAttribute("height", "20");
    expect(svg).toHaveClass("text-text-primary");
  });

  it("applies each size", () => {
    const sizes = [16, 20, 24, 32] as const;
    sizes.forEach((size) => {
      const { container, unmount } = render(<Icon icon={Star} size={size} />);
      expect(container.querySelector("svg")).toHaveAttribute(
        "width",
        String(size),
      );
      unmount();
    });
  });

  it("applies each color", () => {
    const expected = {
      primary: "text-text-primary",
      secondary: "text-text-secondary",
      muted: "text-text-muted",
      disabled: "text-text-disabled",
      inverse: "text-text-inverse",
      success: "text-success-text",
      warning: "text-warning-text",
      danger: "text-danger-text",
      info: "text-info-text",
      "accent-lime": "text-accent-lime",
      "accent-pink": "text-accent-pink",
      "accent-yellow": "text-accent-yellow",
      "accent-blue": "text-accent-blue",
    } as const;
    (Object.keys(expected) as (keyof typeof expected)[]).forEach((color) => {
      const { container, unmount } = render(<Icon icon={Star} color={color} />);
      expect(container.querySelector("svg")).toHaveClass(expected[color]);
      unmount();
    });
  });

  it("is hidden from assistive tech without a label", () => {
    const { container } = render(<Icon icon={Star} />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).not.toHaveAttribute("aria-label");
  });

  it("exposes an accessible name when a label is given", () => {
    render(<Icon icon={Star} label="Favorite" />);
    const img = screen.getByRole("img", { name: "Favorite" });
    expect(img).not.toHaveAttribute("aria-hidden");
  });

  it("receives ref via props", () => {
    const ref = createRef<SVGSVGElement>();
    render(<Icon icon={Star} ref={ref} />);
    expect(ref.current).toBeInstanceOf(SVGSVGElement);
  });

  it("merges custom className", () => {
    const { container } = render(<Icon icon={Star} className="custom-class" />);
    expect(container.querySelector("svg")).toHaveClass("custom-class");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <>
        <Icon icon={Star} />
        <Icon icon={Star} label="Favorite" />
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
