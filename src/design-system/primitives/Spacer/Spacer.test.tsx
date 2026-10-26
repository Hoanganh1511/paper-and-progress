import { createRef } from "react";
import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { Spacer } from "./Spacer";

expect.extend(toHaveNoViolations);

const sizes = [1, 2, 3, 4, 5, 6, 8, 12, 16, 24] as const;

describe("Spacer", () => {
  it("renders a hidden vertical spacer with default size", () => {
    const { container } = render(<Spacer />);
    const el = container.firstElementChild;
    expect(el).toHaveAttribute("aria-hidden", "true");
    expect(el).toHaveClass("block", "h-4");
  });

  it("applies each size vertically", () => {
    sizes.forEach((size) => {
      const { container, unmount } = render(<Spacer size={size} />);
      expect(container.firstElementChild).toHaveClass(`h-${size}`);
      unmount();
    });
  });

  it("applies each size horizontally", () => {
    sizes.forEach((size) => {
      const { container, unmount } = render(
        <Spacer axis="horizontal" size={size} />,
      );
      const el = container.firstElementChild;
      expect(el).toHaveClass("inline-block", `w-${size}`);
      expect(el?.className).not.toMatch(/(^| )h-/);
      unmount();
    });
  });

  it("receives ref via props", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Spacer ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("merges custom className", () => {
    const { container } = render(<Spacer className="custom-class" />);
    expect(container.firstElementChild).toHaveClass("custom-class");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <>
        <Spacer />
        <Spacer axis="horizontal" size={8} />
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
