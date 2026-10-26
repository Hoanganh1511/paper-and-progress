import { vi } from "vitest";
import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { Plus } from "lucide-react";
import { IconButton } from "./IconButton";

expect.extend(toHaveNoViolations);

describe("IconButton", () => {
  it("renders a square button named by aria-label", () => {
    const { container } = render(<IconButton icon={Plus} aria-label="Add" />);
    const el = screen.getByRole("button", { name: "Add" });
    expect(el).toHaveAttribute("type", "button");
    expect(el).toHaveClass("aspect-square", "px-0");
    expect(container.querySelector("svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("renders each variant and size", () => {
    const variants = [
      "primary",
      "secondary",
      "outline",
      "ghost",
      "destructive",
      "accent",
    ] as const;
    variants.forEach((variant) => {
      const { unmount } = render(
        <IconButton icon={Plus} aria-label="Add" variant={variant} />,
      );
      expect(screen.getByRole("button")).toBeInTheDocument();
      unmount();
    });
    const sizes = ["compact", "default", "comfortable"] as const;
    sizes.forEach((size) => {
      const { unmount } = render(
        <IconButton icon={Plus} aria-label="Add" size={size} />,
      );
      expect(screen.getByRole("button")).toHaveClass(
        `h-[var(--height-${size})]`,
      );
      unmount();
    });
  });

  it("calls onClick", async () => {
    const onClick = vi.fn();
    render(<IconButton icon={Plus} aria-label="Add" onClick={onClick} />);
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("receives ref via props", () => {
    const ref = createRef<HTMLButtonElement>();
    render(<IconButton icon={Plus} aria-label="Add" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("merges custom className", () => {
    render(
      <IconButton icon={Plus} aria-label="Add" className="custom-class" />,
    );
    expect(screen.getByRole("button")).toHaveClass("custom-class");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<IconButton icon={Plus} aria-label="Add" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
