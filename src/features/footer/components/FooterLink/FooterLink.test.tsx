import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { FooterLink } from "./FooterLink";

expect.extend(toHaveNoViolations);

describe("FooterLink", () => {
  it("opens the other site in a new tab without leaking the opener", () => {
    render(<FooterLink href="https://zalo.me/x">Nhóm Zalo hỗ trợ</FooterLink>);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "https://zalo.me/x");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("names the link by its text and says it opens in a new tab", () => {
    render(<FooterLink href="https://zalo.me/x">Nhóm Zalo hỗ trợ</FooterLink>);
    expect(screen.getByRole("link")).toHaveAccessibleName(
      /^Nhóm Zalo hỗ trợ\s*\(mở trong tab mới\)$/,
    );
  });

  it("lets the hint be translated", () => {
    render(
      <FooterLink
        href="https://example.com"
        externalLabel="(opens in a new tab)"
      >
        Support
      </FooterLink>,
    );
    expect(screen.getByRole("link")).toHaveAccessibleName(
      /^Support\s*\(opens in a new tab\)$/,
    );
  });

  it("hides the icon and the external arrow from assistive technology", () => {
    const { container } = render(
      <FooterLink href="https://example.com" icon={<svg data-testid="icon" />}>
        Label
      </FooterLink>,
    );
    expect(screen.getByTestId("icon").parentElement).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    const arrow = container.querySelector("svg.lucide-arrow-up-right");
    expect(arrow).toHaveAttribute("aria-hidden", "true");
  });

  it("is at least 44px tall and shows a focus ring", () => {
    render(<FooterLink href="https://example.com">Label</FooterLink>);
    expect(screen.getByRole("link")).toHaveClass(
      "min-h-11",
      "focus-visible:outline-2",
    );
  });

  it("receives ref via props and merges className", () => {
    const ref = createRef<HTMLAnchorElement>();
    render(
      <FooterLink href="https://example.com" ref={ref} className="custom-class">
        Label
      </FooterLink>,
    );
    expect(ref.current).toBe(screen.getByRole("link"));
    expect(ref.current).toHaveClass("custom-class");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <FooterLink href="https://example.com" icon={<svg />}>
        Label
      </FooterLink>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
