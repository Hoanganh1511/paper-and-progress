import { vi } from "vitest";
import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { ArrowRight, Plus } from "lucide-react";
import { Button } from "./Button";

expect.extend(toHaveNoViolations);

describe("Button", () => {
  it("renders a button with type=button by default", () => {
    render(<Button>Save</Button>);
    const el = screen.getByRole("button", { name: "Save" });
    expect(el).toHaveAttribute("type", "button");
    expect(el).toHaveClass("bg-action-primary", "h-[var(--height-default)]");
  });

  it("allows overriding type", () => {
    render(<Button type="submit">Send</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });

  it("renders each variant", () => {
    const expected = {
      primary: "bg-action-primary",
      secondary: "border-border-subtle",
      outline: "border-border-strong",
      ghost: "bg-transparent",
      destructive: "bg-danger-text",
      accent: "bg-accent-lime",
    } as const;
    (Object.keys(expected) as (keyof typeof expected)[]).forEach((variant) => {
      const { unmount } = render(<Button variant={variant}>Test</Button>);
      expect(screen.getByRole("button")).toHaveClass(expected[variant]);
      unmount();
    });
  });

  it("renders each size", () => {
    const sizes = ["compact", "default", "comfortable"] as const;
    sizes.forEach((size) => {
      const { unmount } = render(<Button size={size}>Test</Button>);
      expect(screen.getByRole("button")).toHaveClass(
        `h-[var(--height-${size})]`,
      );
      unmount();
    });
  });

  it("renders left and right icons hidden from assistive tech", () => {
    const { container } = render(
      <Button leftIcon={Plus} rightIcon={ArrowRight}>
        Add
      </Button>,
    );
    const icons = container.querySelectorAll("svg");
    expect(icons).toHaveLength(2);
    icons.forEach((icon) =>
      expect(icon).toHaveAttribute("aria-hidden", "true"),
    );
  });

  it("applies full width", () => {
    render(<Button isFullWidth>Test</Button>);
    expect(screen.getByRole("button")).toHaveClass("w-full");
  });

  it("shows a spinner, sets aria-busy and ignores clicks while loading", async () => {
    const onClick = vi.fn();
    const { container } = render(
      <Button isLoading leftIcon={Plus} onClick={onClick}>
        Save
      </Button>,
    );
    const el = screen.getByRole("button", { name: "Save" });
    expect(el).toHaveAttribute("aria-busy", "true");
    expect(el).toHaveAttribute("aria-disabled", "true");
    expect(container.querySelectorAll("svg")).toHaveLength(1);
    expect(container.querySelector("svg")).toHaveClass("animate-spin");
    await userEvent.click(el);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("calls onClick when not loading", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Test</Button>);
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not fire onClick when disabled", async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Test
      </Button>,
    );
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("is keyboard accessible", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Test</Button>);
    await userEvent.tab();
    expect(screen.getByRole("button")).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("receives ref via props", () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Test</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("merges custom className", () => {
    render(<Button className="custom-class">Test</Button>);
    expect(screen.getByRole("button")).toHaveClass("custom-class");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <>
        <Button>Default</Button>
        <Button leftIcon={Plus} isLoading>
          Loading
        </Button>
        <Button disabled>Disabled</Button>
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
