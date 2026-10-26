import { createRef } from "react";
import { render, screen, within } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { MarketingLayout, type MarketingLayoutProps } from "./MarketingLayout";

expect.extend(toHaveNoViolations);

function setup(props: Partial<MarketingLayoutProps> = {}) {
  return render(
    <MarketingLayout
      navbar={<a href="#top">Paper &amp; Progress</a>}
      footer={<p>© 2026 Paper &amp; Progress</p>}
      {...props}
    >
      <h1>Welcome</h1>
    </MarketingLayout>,
  );
}

describe("MarketingLayout", () => {
  it("renders the skip link, navbar, main content and footer", () => {
    setup();
    expect(
      screen.getByRole("link", { name: "Skip to main content" }),
    ).toHaveAttribute("href", "#main-content");
    expect(
      within(screen.getByRole("banner")).getByRole("link", {
        name: "Paper & Progress",
      }),
    ).toBeInTheDocument();
    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("id", "main-content");
    expect(
      within(main).getByRole("heading", { name: "Welcome" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toHaveTextContent(
      "© 2026 Paper & Progress",
    );
  });

  it("orders navbar, main and footer, with the footer pushed down on short pages", () => {
    const { container } = setup();
    const children = Array.from(
      container.firstElementChild?.children ?? [],
    ).map((element) => element.tagName);
    expect(children).toEqual(["A", "HEADER", "MAIN", "FOOTER"]);
    expect(container.firstElementChild).toHaveClass(
      "flex",
      "min-h-dvh",
      "flex-col",
    );
    expect(screen.getByRole("main")).toHaveClass("flex-1");
  });

  it("does not constrain the width of the content", () => {
    setup();
    expect(screen.getByRole("heading", { name: "Welcome" }).parentElement).toBe(
      screen.getByRole("main"),
    );
  });

  it("sticks the navbar only when asked", () => {
    const { unmount } = setup();
    expect(screen.getByRole("banner")).not.toHaveClass("sticky");
    expect(screen.getByRole("banner").className).not.toMatch(/(^|\s)z-/);
    unmount();
    setup({ isNavbarSticky: true });
    expect(screen.getByRole("banner")).toHaveClass(
      "sticky",
      "top-0",
      "z-[var(--z-dropdown)]",
    );
  });

  it("accepts a translated skip link label", () => {
    setup({ skipToContentLabel: "Bỏ qua điều hướng" });
    expect(
      screen.getByRole("link", { name: "Bỏ qua điều hướng" }),
    ).toBeInTheDocument();
  });

  it("receives ref via props and merges className", () => {
    const ref = createRef<HTMLDivElement>();
    setup({ ref, className: "custom-class" });
    expect(ref.current).toHaveClass("custom-class");
  });

  it("has no accessibility violations", async () => {
    const { container } = setup({ isNavbarSticky: true });
    expect(await axe(container)).toHaveNoViolations();
  });
});
