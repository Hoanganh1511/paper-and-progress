import { createRef } from "react";
import { vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { Star } from "lucide-react";
import { Badge } from "./Badge";

expect.extend(toHaveNoViolations);

describe("Badge", () => {
  it("renders a pill with default variant and md size", () => {
    render(<Badge>New</Badge>);
    const el = screen.getByText("New");
    expect(el.tagName).toBe("SPAN");
    expect(el).toHaveClass("rounded-pill", "bg-surface-sunken", "h-6");
  });

  it("renders each variant", () => {
    const expected = {
      default: "bg-surface-sunken",
      lime: "bg-accent-lime",
      pink: "bg-accent-pink",
      yellow: "bg-accent-yellow",
      blue: "bg-accent-blue",
      success: "bg-success-bg",
      warning: "bg-warning-bg",
      danger: "bg-danger-bg",
    } as const;
    (Object.keys(expected) as (keyof typeof expected)[]).forEach((variant) => {
      const { unmount } = render(<Badge variant={variant}>Test</Badge>);
      expect(screen.getByText("Test")).toHaveClass(expected[variant]);
      unmount();
    });
  });

  it("renders each size", () => {
    const { rerender } = render(<Badge size="sm">Test</Badge>);
    expect(screen.getByText("Test")).toHaveClass("h-5", "text-caption");
    rerender(<Badge size="md">Test</Badge>);
    expect(screen.getByText("Test")).toHaveClass("h-6", "text-body-sm");
  });

  it("renders a hidden dot and a hidden icon", () => {
    const { container } = render(
      <Badge dot icon={Star}>
        Featured
      </Badge>,
    );
    const hidden = container.querySelectorAll('[aria-hidden="true"]');
    expect(hidden).toHaveLength(2);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("has no remove button unless removable", () => {
    render(<Badge>Test</Badge>);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("calls onRemove from a named remove button", async () => {
    const onRemove = vi.fn();
    render(
      <Badge removable onRemove={onRemove}>
        React
      </Badge>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Remove React" }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("is keyboard operable and supports a custom remove label", async () => {
    const onRemove = vi.fn();
    render(
      <Badge removable onRemove={onRemove} removeLabel="Xoá thẻ">
        React
      </Badge>,
    );
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "Xoá thẻ" })).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("receives ref via props", () => {
    const ref = createRef<HTMLSpanElement>();
    render(<Badge ref={ref}>Test</Badge>);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it("merges custom className", () => {
    render(<Badge className="custom-class">Test</Badge>);
    expect(screen.getByText("Test")).toHaveClass("custom-class");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <>
        <Badge>Default</Badge>
        <Badge variant="success" dot>
          Active
        </Badge>
        <Badge variant="blue" icon={Star} removable>
          Featured
        </Badge>
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
