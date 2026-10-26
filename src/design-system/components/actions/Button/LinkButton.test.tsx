import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { ArrowRight, Plus } from "lucide-react";
import { LinkButton } from "./LinkButton";

expect.extend(toHaveNoViolations);

describe("LinkButton", () => {
  it("renders a link with button styling", () => {
    render(<LinkButton href="/docs">Docs</LinkButton>);
    const el = screen.getByRole("link", { name: "Docs" });
    expect(el).toHaveAttribute("href", "/docs");
    expect(el).not.toHaveAttribute("target");
    expect(el).toHaveClass("bg-action-primary", "no-underline");
  });

  it("opens in a new tab safely when external", () => {
    render(
      <LinkButton href="https://example.com" external>
        Example
      </LinkButton>,
    );
    const el = screen.getByRole("link", { name: /Example/ });
    expect(el).toHaveAttribute("target", "_blank");
    expect(el).toHaveAttribute("rel", "noopener noreferrer");
    expect(el).toHaveAccessibleName(/Example\s*\(opens in a new tab\)/);
  });

  it("lets the new-tab hint be translated", () => {
    render(
      <LinkButton
        href="https://example.com"
        external
        externalLabel="(mở tab mới)"
      >
        Ví dụ
      </LinkButton>,
    );
    expect(screen.getByRole("link")).toHaveAccessibleName(
      /Ví dụ\s*\(mở tab mới\)/,
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
        <LinkButton href="/" variant={variant}>
          Test
        </LinkButton>,
      );
      expect(screen.getByRole("link")).toBeInTheDocument();
      unmount();
    });
    const sizes = ["compact", "default", "comfortable"] as const;
    sizes.forEach((size) => {
      const { unmount } = render(
        <LinkButton href="/" size={size}>
          Test
        </LinkButton>,
      );
      expect(screen.getByRole("link")).toHaveClass(`h-[var(--height-${size})]`);
      unmount();
    });
  });

  it("renders icons and full width", () => {
    const { container } = render(
      <LinkButton href="/" leftIcon={Plus} rightIcon={ArrowRight} isFullWidth>
        Go
      </LinkButton>,
    );
    expect(container.querySelectorAll("svg")).toHaveLength(2);
    expect(screen.getByRole("link")).toHaveClass("w-full");
  });

  it("receives ref via props", () => {
    const ref = createRef<HTMLAnchorElement>();
    render(
      <LinkButton href="/" ref={ref}>
        Test
      </LinkButton>,
    );
    expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
  });

  it("merges custom className", () => {
    render(
      <LinkButton href="/" className="custom-class">
        Test
      </LinkButton>,
    );
    expect(screen.getByRole("link")).toHaveClass("custom-class");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <>
        <LinkButton href="/docs">Docs</LinkButton>
        <LinkButton href="https://example.com" external rightIcon={ArrowRight}>
          Example
        </LinkButton>
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
