import { createRef } from "react";
import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { Skeleton } from "./Skeleton";

expect.extend(toHaveNoViolations);

const element = (container: HTMLElement) =>
  container.firstElementChild as HTMLElement;

describe("Skeleton", () => {
  it("renders a hidden text skeleton by default", () => {
    const { container } = render(<Skeleton />);
    expect(element(container)).toHaveAttribute("aria-hidden", "true");
    expect(element(container)).toHaveClass("h-4", "w-full", "rounded-sharp");
  });

  it("renders each variant", () => {
    const expected = {
      text: ["h-4", "rounded-sharp"],
      circle: ["size-10", "rounded-pill"],
      rect: ["h-24", "rounded-standard"],
    } as const;
    (Object.keys(expected) as (keyof typeof expected)[]).forEach((variant) => {
      const { container, unmount } = render(<Skeleton variant={variant} />);
      expect(element(container)).toHaveClass(...expected[variant]);
      unmount();
    });
  });

  it("pulses, and stops pulsing when reduced motion is preferred", () => {
    const { container } = render(<Skeleton />);
    expect(element(container)).toHaveClass(
      "animate-pulse",
      "motion-reduce:animate-none",
    );
  });

  it("lets className override the default size", () => {
    const { container } = render(<Skeleton className="h-8 w-1/2" />);
    expect(element(container)).toHaveClass("h-8", "w-1/2");
    expect(element(container)).not.toHaveClass("h-4", "w-full");
  });

  it("receives ref via props", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Skeleton ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <div aria-busy="true">
        <Skeleton variant="circle" />
        <Skeleton />
        <Skeleton variant="rect" />
      </div>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
