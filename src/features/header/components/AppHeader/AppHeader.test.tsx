import { createRef } from "react";
import { vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import {
  APP_HEADER_HEIGHT_VAR,
  AppHeader,
  type AppHeaderProps,
} from "./AppHeader";

expect.extend(toHaveNoViolations);

function setup(props: Partial<AppHeaderProps> = {}) {
  return render(
    <AppHeader
      facebookHref="https://www.facebook.com/baolingo"
      score={227}
      profileBadge={1}
      {...props}
    />,
  );
}

const pathname = vi.hoisted(() => ({ current: "/" as string | null }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.current }));

describe("AppHeader", () => {
  afterEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove("dark");
    document.documentElement.removeAttribute("data-theme");
  });

  describe("navigation", () => {
    afterEach(() => {
      pathname.current = "/";
    });

    it("lists the page links in a named navigation", () => {
      setup();
      const nav = screen.getByRole("navigation", { name: "Điều hướng chính" });
      expect(
        within(nav).getByRole("link", { name: "Học tập" }),
      ).toHaveAttribute("href", "/learn");
      expect(
        within(nav).getByRole("link", { name: "Công nghệ thông tin" }),
      ).toHaveAttribute("href", "/goals/tech");
    });

    it("marks the current page, including deeper paths of a section", () => {
      pathname.current = "/learn";
      const { unmount } = setup();
      expect(screen.getByRole("link", { name: "Học tập" })).toHaveAttribute(
        "aria-current",
        "page",
      );
      expect(
        screen.getByRole("link", { name: "Công nghệ thông tin" }),
      ).not.toHaveAttribute("aria-current");
      unmount();

      pathname.current = "/goals/tech/react";
      setup();
      expect(
        screen.getByRole("link", { name: "Công nghệ thông tin" }),
      ).toHaveAttribute("aria-current", "page");
      expect(screen.getByRole("link", { name: "Học tập" })).not.toHaveAttribute(
        "aria-current",
      );
    });

    it("takes custom items; the goals and call-to-action links stay even when empty", () => {
      const { unmount } = setup({
        navItems: [{ label: "Từ điển", href: "/dictionary" }],
      });
      expect(screen.getByRole("link", { name: "Từ điển" })).toHaveAttribute(
        "href",
        "/dictionary",
      );
      unmount();

      setup({ navItems: [] });
      const nav = screen.getByRole("navigation", { name: "Điều hướng chính" });
      expect(
        within(nav).getByRole("link", { name: "Mục tiêu tiếng Anh" }),
      ).toBeInTheDocument();
      expect(
        within(nav).getByRole("link", { name: /学习从这里开始~/ }),
      ).toBeInTheDocument();
      expect(
        within(nav).queryByRole("link", { name: "Từ điển" }),
      ).not.toBeInTheDocument();
    });
  });

  describe("brand", () => {
    it("is a banner in Vietnamese with the logo and name linking home", () => {
      setup();
      const banner = screen.getByRole("banner");
      expect(banner).toHaveAttribute("lang", "vi");
      const brand = within(banner).getByRole("link", { name: "Baolingo" });
      expect(brand).toHaveAttribute("href", "/");
      expect(brand.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    });

    it("can link somewhere else", () => {
      setup({ brandHref: "/home" });
      expect(screen.getByRole("link", { name: "Baolingo" })).toHaveAttribute(
        "href",
        "/home",
      );
    });
  });

  describe("goals button", () => {
    afterEach(() => {
      pathname.current = "/";
    });

    it("is a highlighted link to the English goals page, in the nav bar", () => {
      setup();
      const nav = screen.getByRole("navigation", { name: "Điều hướng chính" });
      const link = within(nav).getByRole("link", {
        name: "Mục tiêu tiếng Anh",
      });
      expect(link).toHaveAttribute("href", "/goals/english");
      expect(link).toHaveClass("bg-accent-pink");
      expect(link.querySelector("svg")).toHaveClass("lucide-graduation-cap");
      expect(link.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
      expect(link).not.toHaveAttribute("aria-current");
    });

    it("marks itself current on the goals page and its subpaths", () => {
      pathname.current = "/goals/english/ielts";
      setup();
      expect(
        screen.getByRole("link", { name: "Mục tiêu tiếng Anh" }),
      ).toHaveAttribute("aria-current", "page");
    });

    it("can point elsewhere", () => {
      setup({ goalsHref: "/goals/en" });
      expect(
        screen.getByRole("link", { name: "Mục tiêu tiếng Anh" }),
      ).toHaveAttribute("href", "/goals/en");
    });
  });

  describe("search and call to action", () => {
    it("has a dictionary search that works without JavaScript (a GET form)", () => {
      setup();
      const search = screen.getByRole("search");
      expect(search.tagName).toBe("FORM");
      expect(search).toHaveAttribute("action", "/dictionary");
      expect(search).toHaveAttribute("method", "get");
      const box = within(search).getByRole("searchbox", { name: "Từ điển" });
      expect(box).toHaveAttribute("name", "q");
      expect(box).toHaveAttribute("placeholder", "Từ điển");
      expect(search.querySelector("svg")).toHaveAttribute(
        "aria-hidden",
        "true",
      );
    });

    it("types a query and offers to clear it", async () => {
      setup();
      const box = screen.getByRole("searchbox");
      await userEvent.type(box, "mèo");
      expect(box).toHaveValue("mèo");
      await userEvent.click(
        screen.getByRole("button", { name: "Clear search" }),
      );
      expect(box).toHaveValue("");
    });

    it("can point the search elsewhere", () => {
      setup({ searchAction: "/tu-dien" });
      expect(screen.getByRole("search")).toHaveAttribute("action", "/tu-dien");
    });

    it("has a call to action that links to the learning page, in the nav bar", () => {
      setup();
      const nav = screen.getByRole("navigation", { name: "Điều hướng chính" });
      const link = within(nav).getByRole("link", { name: /学习从这里开始~/ });
      expect(link).toHaveAttribute("href", "/learn");
      // The arrow and the heart are decorative and left out of the name.
      expect(link).toHaveAccessibleName(
        /^学习从这里开始~\s*\(Bắt đầu học từ đây\)$/,
      );
      expect(link.querySelector('[lang="zh-Hans"]')).toHaveTextContent(
        "学习从这里开始~",
      );
      expect(link).toHaveClass("bg-accent-lime");
    });

    it("hides the decorative arrow and heart from its accessible name", () => {
      setup();
      const link = screen.getByRole("link", { name: /学习从这里开始~/ });
      const hidden = Array.from(
        link.querySelectorAll('[aria-hidden="true"]'),
      ).map((element) => element.textContent);
      expect(hidden).toEqual(["→", "♡"]);
    });

    it("can lead elsewhere", () => {
      setup({ learnHref: "/start" });
      expect(
        screen.getByRole("link", { name: /学习从这里开始/ }),
      ).toHaveAttribute("href", "/start");
    });
  });

  describe("facebook", () => {
    it("opens the community in a new tab, with a translated hint", () => {
      setup();
      const link = screen.getByRole("link", { name: /Facebook Community/ });
      expect(link).toHaveAttribute("href", "https://www.facebook.com/baolingo");
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
      expect(link).toHaveAccessibleName(
        /^Facebook Community\s*\(mở trong tab mới\)$/,
      );
      expect(link.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    });

    it("keeps its name when the label is visually hidden below lg", () => {
      setup();
      expect(screen.getByText("Facebook Community")).toHaveClass(
        "sr-only",
        "lg:not-sr-only",
      );
    });

    it("is left out without a link", () => {
      setup({ facebookHref: undefined });
      expect(
        screen.queryByRole("link", { name: /Facebook/ }),
      ).not.toBeInTheDocument();
    });
  });

  describe("dark mode", () => {
    it("is a toggle button that switches the theme and remembers it", async () => {
      setup();
      const toggle = screen.getByRole("button", { name: "Chế độ tối" });
      expect(toggle).toHaveAttribute("aria-pressed", "false");

      await userEvent.click(toggle);
      expect(toggle).toHaveAttribute("aria-pressed", "true");
      expect(document.documentElement).toHaveClass("dark");
      expect(window.localStorage.getItem("theme")).toBe("dark");

      await userEvent.click(toggle);
      expect(toggle).toHaveAttribute("aria-pressed", "false");
      expect(document.documentElement).not.toHaveClass("dark");
    });

    it("shows a moon in light mode and a sun in dark mode", async () => {
      setup();
      const toggle = screen.getByRole("button", { name: "Chế độ tối" });
      expect(toggle.querySelector("svg")).toHaveClass("lucide-moon");
      await userEvent.click(toggle);
      expect(toggle.querySelector("svg")).toHaveClass("lucide-sun");
    });
  });

  describe("language", () => {
    it("shows the current language with its flag", () => {
      setup();
      const trigger = screen.getByRole("button", {
        name: "Ngôn ngữ: Tiếng Việt",
      });
      expect(trigger).toHaveAttribute("aria-haspopup", "menu");
      expect(trigger).toHaveTextContent("Tiếng Việt");
      expect(
        trigger.querySelector('svg[viewBox="0 0 30 20"]'),
      ).toBeInTheDocument();
    });

    it("lists the languages, marking the current one", async () => {
      setup();
      await userEvent.click(screen.getByRole("button", { name: /Ngôn ngữ/ }));
      const menu = screen.getByRole("menu");
      expect(
        within(menu).getByRole("menuitem", {
          name: /^Tiếng Việt\s*\(đang chọn\)$/,
        }),
      ).toBeInTheDocument();
      expect(
        within(menu).getByRole("menuitem", { name: "English" }),
      ).toBeInTheDocument();
    });

    it("switches language and reports it", async () => {
      const onLanguageChange = vi.fn();
      setup({ onLanguageChange });
      await userEvent.click(screen.getByRole("button", { name: /Ngôn ngữ/ }));
      await userEvent.click(screen.getByRole("menuitem", { name: "English" }));
      expect(onLanguageChange).toHaveBeenCalledWith("en");
      expect(
        screen.getByRole("button", { name: "Ngôn ngữ: English" }),
      ).toBeInTheDocument();
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });

    it("can start in another language and use a custom list", () => {
      setup({
        languages: [
          { code: "vi", label: "Tiếng Việt" },
          { code: "ja", label: "日本語" },
        ],
        defaultLanguage: "ja",
      });
      expect(
        screen.getByRole("button", { name: "Ngôn ngữ: 日本語" }),
      ).toBeInTheDocument();
    });

    it("is left out with no languages", () => {
      setup({ languages: [] });
      expect(
        screen.queryByRole("button", { name: /Ngôn ngữ/ }),
      ).not.toBeInTheDocument();
    });
  });

  describe("notifications", () => {
    it("links to the notifications page", () => {
      setup();
      const link = screen.getByRole("link", { name: "Thông báo" });
      expect(link).toHaveAttribute("href", "/notifications");
      expect(link.querySelector("svg")).toHaveClass("lucide-bell");
    });

    it("says there is something unread, and shows a dot", () => {
      const { container } = setup({ unreadNotifications: 3 });
      expect(
        screen.getByRole("link", { name: "Thông báo, có tin chưa đọc" }),
      ).toBeInTheDocument();
      expect(container.querySelector(".bg-danger-text")).toHaveAttribute(
        "aria-hidden",
        "true",
      );
    });

    it("has no dot when nothing is unread", () => {
      const { container } = setup({ unreadNotifications: 0 });
      expect(
        container.querySelector(".bg-danger-text"),
      ).not.toBeInTheDocument();
    });
  });

  describe("score", () => {
    it("shows the number beside a lightning bolt and reads it as points", () => {
      const { container } = setup();
      expect(screen.getByText("227 điểm")).toHaveClass("sr-only");
      const badge = screen.getByText("227").parentElement as HTMLElement;
      expect(badge).toHaveClass("bg-accent-yellow");
      expect(badge.querySelector("svg")).toHaveClass("lucide-zap");
      expect(badge.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
      expect(container).toBeInTheDocument();
    });

    it("is left out without a score and keeps zero", () => {
      const { unmount } = setup({ score: undefined });
      expect(screen.queryByText(/điểm/)).not.toBeInTheDocument();
      unmount();
      setup({ score: 0 });
      expect(screen.getByText("0 điểm")).toBeInTheDocument();
    });
  });

  describe("profile", () => {
    it("links to the profile and announces the badge", () => {
      setup();
      const link = screen.getByRole("link", { name: "Hồ sơ, 1 mục mới" });
      expect(link).toHaveAttribute("href", "/profile");
      const badge = within(link).getByText("1");
      expect(badge).toHaveAttribute("aria-hidden", "true");
    });

    it("has no badge when there is nothing new", () => {
      setup({ profileBadge: 0 });
      const link = screen.getByRole("link", { name: "Hồ sơ" });
      expect(within(link).queryByText("0")).not.toBeInTheDocument();
    });
  });

  describe("layout", () => {
    it("wraps to two rows below md: logo + status first, then search + controls", () => {
      setup();
      const brand = screen.getByRole("link", { name: "Baolingo" });
      const search = screen.getByRole("search").parentElement as HTMLElement;
      const status = screen
        .getByRole("link", { name: /Thông báo/ })
        .closest(".order-2") as HTMLElement;
      expect(brand).toHaveClass("order-1");
      expect(search).toHaveClass("order-3", "w-full", "md:contents");
      expect(status).toHaveClass("order-2", "ml-auto", "md:order-5");
      expect(search.parentElement).toHaveClass("flex-wrap", "md:flex-nowrap");
    });

    it("is not sticky unless asked", () => {
      const { unmount } = setup();
      expect(screen.getByRole("banner")).not.toHaveClass("sticky");
      unmount();
      setup({ isSticky: true });
      expect(screen.getByRole("banner")).toHaveClass("sticky", "top-0");
    });

    // The header is a flex item of <body>, so any z-index would make it a
    // stacking context and trap the language menu beneath later sticky bars
    // (such as the tab bar of /learn, z-sticky).
    it("does not trap its menus in a stacking context", async () => {
      setup();
      const banner = screen.getByRole("banner");
      expect(banner.className).not.toMatch(/(^|\s)z-/);

      await userEvent.click(screen.getByRole("button", { name: /Ngôn ngữ/ }));
      expect(screen.getByRole("menu")).toHaveClass("z-[var(--z-dropdown)]");
    });

    describe("publishing its height", () => {
      let resize: () => void;
      let disconnect: ReturnType<typeof vi.fn>;
      const rootValue = () =>
        document.documentElement.style.getPropertyValue(APP_HEADER_HEIGHT_VAR);

      beforeEach(() => {
        disconnect = vi.fn();
        vi.stubGlobal(
          "ResizeObserver",
          class {
            constructor(callback: () => void) {
              resize = callback;
            }
            observe() {}
            disconnect = disconnect;
          },
        );
        vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(
          64,
        );
      });
      afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
        document.documentElement.style.removeProperty(APP_HEADER_HEIGHT_VAR);
      });

      it("sets --app-header-height while sticky, follows resizes, and clears it", () => {
        const { unmount } = setup({ isSticky: true });
        expect(rootValue()).toBe("64px");

        vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(
          108,
        );
        resize();
        expect(rootValue()).toBe("108px");

        unmount();
        expect(rootValue()).toBe("");
        expect(disconnect).toHaveBeenCalled();
      });

      it("leaves the variable alone when not sticky", () => {
        setup({ isSticky: false });
        expect(rootValue()).toBe("");
      });

      it("clears the variable when it stops being sticky", () => {
        const { rerender } = setup({ isSticky: true });
        expect(rootValue()).toBe("64px");
        rerender(<AppHeader isSticky={false} />);
        expect(rootValue()).toBe("");
      });
    });

    it("still publishes the height without ResizeObserver", () => {
      vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(
        64,
      );
      const { unmount } = setup({ isSticky: true });
      expect(
        document.documentElement.style.getPropertyValue(APP_HEADER_HEIGHT_VAR),
      ).toBe("64px");
      unmount();
      expect(
        document.documentElement.style.getPropertyValue(APP_HEADER_HEIGHT_VAR),
      ).toBe("");
      vi.restoreAllMocks();
    });

    it("lifts a sticky header above sticky content below it", () => {
      setup({ isSticky: true });
      expect(screen.getByRole("banner")).toHaveClass("z-[var(--z-dropdown)]");
    });
  });

  it("accepts translated labels", () => {
    setup({
      labels: {
        brand: "Báo Lingo",
        dictionary: "Tra từ",
        darkMode: "Giao diện tối",
        profile: "Tài khoản",
      },
      profileBadge: undefined,
    });
    expect(screen.getByRole("link", { name: "Báo Lingo" })).toBeInTheDocument();
    expect(
      screen.getByRole("searchbox", { name: "Tra từ" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Giao diện tối" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Tài khoản" })).toBeInTheDocument();
  });

  it("receives ref via props and merges className", () => {
    const ref = createRef<HTMLElement>();
    setup({ ref, className: "custom-class" });
    expect(ref.current).toBe(screen.getByRole("banner"));
    expect(ref.current).toHaveClass("custom-class");
  });

  it("is reachable and operable with the keyboard, in reading order", async () => {
    setup({ unreadNotifications: 1 });
    const order = [
      /^Baolingo$/,
      /^Từ điển$/,
      /^Facebook Community/,
      /^Chế độ tối$/,
      /^Ngôn ngữ: Tiếng Việt$/,
      /^Thông báo, có tin chưa đọc$/,
      /^Hồ sơ, 1 mục mới$/,
    ];
    for (const name of order) {
      await userEvent.tab();
      expect(document.activeElement).toHaveAccessibleName(name);
    }
  });

  it("has no accessibility violations, closed and with the language menu open", async () => {
    const { container } = setup({ unreadNotifications: 2, isSticky: true });
    expect(await axe(container)).toHaveNoViolations();
    await userEvent.click(screen.getByRole("button", { name: /Ngôn ngữ/ }));
    expect(await axe(container)).toHaveNoViolations();
  });
});
