import { createRef } from "react";
import { render, screen, within } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { AppFooter, type AppFooterProps } from "./AppFooter";

expect.extend(toHaveNoViolations);

const LINKS = {
  zaloHref: "https://zalo.me/g/support",
  communityHref: "https://www.facebook.com/groups/learning",
};

function setup(props: Partial<AppFooterProps> = {}) {
  return render(<AppFooter {...LINKS} {...props} />);
}

describe("AppFooter", () => {
  it("is a contentinfo landmark in Vietnamese", () => {
    setup();
    expect(screen.getByRole("contentinfo")).toHaveAttribute("lang", "vi");
  });

  describe("left column", () => {
    it("names the product", () => {
      setup();
      const footer = screen.getByRole("contentinfo");
      expect(footer).toHaveTextContent("Paper & Progress");
      expect(footer).not.toHaveTextContent("DUA Edu");
    });

    it("shows the product name as a bold display heading, not as small body text", () => {
      setup();
      const name = screen.getByText("Paper & Progress");
      expect(name).toHaveClass("font-bold", "font-display");
    });

    it("can name another product", () => {
      setup({ productName: "Baolingo", byline: "Một sản phẩm của Acme" });
      expect(screen.getByText("Baolingo")).toBeInTheDocument();
      expect(screen.getByText("Một sản phẩm của Acme")).toBeInTheDocument();
    });
  });

  describe("middle column", () => {
    it("is a navigation named by a bold heading", () => {
      setup();
      const nav = screen.getByRole("navigation", { name: "Học tập & hỗ trợ" });
      const heading = within(nav).getByRole("heading", {
        level: 2,
        name: "Học tập & hỗ trợ",
      });
      expect(heading).toHaveClass("font-bold");
    });

    it("links the Zalo group and the Facebook community in new tabs", () => {
      setup();
      const nav = screen.getByRole("navigation");
      const zalo = within(nav).getByRole("link", { name: /Nhóm Zalo hỗ trợ/ });
      const community = within(nav).getByRole("link", {
        name: /Cộng đồng Facebook học tập/,
      });
      expect(zalo).toHaveAttribute("href", LINKS.zaloHref);
      expect(community).toHaveAttribute("href", LINKS.communityHref);
      [zalo, community].forEach((link) => {
        expect(link).toHaveAttribute("target", "_blank");
        expect(link).toHaveAttribute("rel", "noopener noreferrer");
        expect(link).toHaveAccessibleName(/\(mở trong tab mới\)$/);
        expect(link.querySelector("svg.lucide-arrow-up-right")).toHaveAttribute(
          "aria-hidden",
          "true",
        );
      });
    });

    it("lists the links in a list", () => {
      setup();
      const list = within(screen.getByRole("navigation")).getByRole("list");
      expect(within(list).getAllByRole("listitem")).toHaveLength(2);
    });

    it("leaves out a link without an address, and the column without any", () => {
      const { unmount } = setup({ zaloHref: undefined });
      expect(
        screen.queryByRole("link", { name: /Zalo/ }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /Cộng đồng/ }),
      ).toBeInTheDocument();
      unmount();

      setup({ zaloHref: undefined, communityHref: undefined });
      expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    });
  });

  describe("layout", () => {
    it("is two columns from md and stacked below", () => {
      const { container } = setup();
      const grid = container.querySelector(".grid") as HTMLElement;
      expect(grid).toHaveClass("md:grid-cols-2");
      expect(grid.children).toHaveLength(2);
    });
  });

  it("is operable with the keyboard, in reading order", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    setup();
    const order = [/^Nhóm Zalo/, /^Cộng đồng Facebook/];
    for (const name of order) {
      await userEvent.tab();
      expect(document.activeElement).toHaveAccessibleName(name);
    }
  });

  it("accepts translated labels", () => {
    setup({
      labels: {
        linksHeading: "Learning & support",
        zalo: "Zalo support group",
        opensInNewTab: "(opens in a new tab)",
      },
    });
    expect(
      screen.getByRole("navigation", { name: "Learning & support" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: /Zalo support group\s*\(opens in a new tab\)/,
      }),
    ).toBeInTheDocument();
  });

  it("receives ref via props and merges className", () => {
    const ref = createRef<HTMLElement>();
    setup({ ref, className: "custom-class" });
    expect(ref.current).toBe(screen.getByRole("contentinfo"));
    expect(ref.current).toHaveClass("custom-class");
  });

  it("has no accessibility violations", async () => {
    const { container } = setup();
    expect(await axe(container)).toHaveNoViolations();
  });
});
