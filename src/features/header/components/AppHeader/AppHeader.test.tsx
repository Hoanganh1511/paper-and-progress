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
const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({
  usePathname: () => pathname.current,
  useRouter: () => ({ push }),
}));

describe("AppHeader", () => {
  afterEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove("dark");
    document.documentElement.removeAttribute("data-theme");
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

  describe("search", () => {
    afterEach(() => {
      pathname.current = "/";
    });

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

    it("is an icon only; the label stays for screen readers", () => {
      setup();
      expect(screen.getByText("Facebook Community")).toHaveClass("sr-only");
      expect(screen.getByText("Facebook Community")).not.toHaveClass(
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

  describe("signed out", () => {
    it("shows a sign-in button instead of the avatar", () => {
      setup({ isSignedOut: true });
      expect(
        screen.queryByRole("button", { name: /Hồ sơ/ }),
      ).not.toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Đăng nhập" })).toBeVisible();
    });

    it("links sign-in to /login", () => {
      setup({ isSignedOut: true });
      expect(screen.getByRole("link", { name: "Đăng nhập" })).toHaveAttribute(
        "href",
        "/login",
      );
    });
  });

  describe("dark mode", () => {
    async function openMenuAndFindSwitch() {
      await userEvent.click(screen.getByRole("button", { name: /Hồ sơ/ }));
      return screen.getByRole("menuitemcheckbox", { name: /Chế độ tối/ });
    }

    it("is no longer a button in the header bar", () => {
      setup();
      expect(
        screen.queryByRole("button", { name: "Chế độ tối" }),
      ).not.toBeInTheDocument();
    });

    it("is a switch in the account menu that changes the theme and remembers it", async () => {
      setup();
      const toggle = await openMenuAndFindSwitch();
      expect(toggle).toHaveAttribute("aria-checked", "false");
      expect(toggle).toHaveTextContent("Tắt");

      await userEvent.click(toggle);
      // The menu stays open so the change can be seen.
      expect(screen.getByRole("menu")).toBeInTheDocument();
      expect(toggle).toHaveAttribute("aria-checked", "true");
      expect(toggle).toHaveTextContent("Bật");
      expect(document.documentElement).toHaveClass("dark");
      expect(window.localStorage.getItem("theme")).toBe("dark");

      await userEvent.click(toggle);
      expect(toggle).toHaveAttribute("aria-checked", "false");
      expect(document.documentElement).not.toHaveClass("dark");
    });

    it("shows a moon in light mode and a sun in dark mode", async () => {
      setup();
      const toggle = await openMenuAndFindSwitch();
      expect(toggle.querySelector("svg")).toHaveClass("lucide-sun");
      await userEvent.click(toggle);
      expect(toggle.querySelector("svg")).toHaveClass("lucide-moon");
    });

    it("can be reached with the arrow keys and toggled with Enter", async () => {
      setup();
      await userEvent.click(screen.getByRole("button", { name: /Hồ sơ/ }));
      await userEvent.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}");
      expect(
        screen.getByRole("menuitemcheckbox", { name: /Chế độ tối/ }),
      ).toHaveFocus();
      await userEvent.keyboard("{Enter}");
      expect(document.documentElement).toHaveClass("dark");
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

  describe("account menu", () => {
    const user = { name: "Nguyễn Văn A", email: "nguyenva@email.com" };

    afterEach(() => {
      push.mockClear();
    });

    it("is a closed menu button that announces the badge", () => {
      setup();
      const trigger = screen.getByRole("button", { name: "Hồ sơ, 1 mục mới" });
      expect(trigger).toHaveAttribute("aria-expanded", "false");
      expect(trigger).toHaveAttribute("aria-haspopup", "menu");
      expect(within(trigger).getByText("1")).toHaveAttribute(
        "aria-hidden",
        "true",
      );
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });

    it("has no badge when there is nothing new", () => {
      setup({ profileBadge: 0 });
      const trigger = screen.getByRole("button", { name: "Hồ sơ" });
      expect(within(trigger).queryByText("0")).not.toBeInTheDocument();
    });

    it("opens on click with the user's info and the links", async () => {
      setup({ user });
      const trigger = screen.getByRole("button", { name: /Hồ sơ/ });
      await userEvent.click(trigger);
      expect(trigger).toHaveAttribute("aria-expanded", "true");

      const menu = screen.getByRole("menu");
      expect(within(menu).getByText("Nguyễn Văn A")).toBeInTheDocument();
      expect(within(menu).getByText("nguyenva@email.com")).toBeInTheDocument();
      expect(
        within(menu)
          .getAllByRole("menuitem")
          .map((item) => item.textContent),
      ).toEqual(["Thông tin cá nhân", "Bookmarks", "Cài đặt", "Đăng xuất"]);
    });

    it("leaves the info section out without a user", async () => {
      setup();
      await userEvent.click(screen.getByRole("button", { name: /Hồ sơ/ }));
      expect(screen.queryByText("nguyenva@email.com")).not.toBeInTheDocument();
    });

    it("goes to the chosen page and closes", async () => {
      setup({ user });
      await userEvent.click(screen.getByRole("button", { name: /Hồ sơ/ }));
      await userEvent.click(
        screen.getByRole("menuitem", { name: "Bookmarks" }),
      );
      expect(push).toHaveBeenCalledWith("/bookmarks");
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });

    it("can lead to other pages", async () => {
      setup({ profileHref: "/me", settingsHref: "/prefs" });
      await userEvent.click(screen.getByRole("button", { name: /Hồ sơ/ }));
      await userEvent.click(
        screen.getByRole("menuitem", { name: "Thông tin cá nhân" }),
      );
      expect(push).toHaveBeenLastCalledWith("/me");
      await userEvent.click(screen.getByRole("button", { name: /Hồ sơ/ }));
      await userEvent.click(screen.getByRole("menuitem", { name: "Cài đặt" }));
      expect(push).toHaveBeenLastCalledWith("/prefs");
    });

    it("adds an admin entry only when given an admin link", async () => {
      setup({ user, adminHref: "/admin" });
      await userEvent.click(screen.getByRole("button", { name: /Hồ sơ/ }));
      await userEvent.click(screen.getByRole("menuitem", { name: "Quản trị" }));
      expect(push).toHaveBeenLastCalledWith("/admin");
    });

    it("has no admin entry by default", async () => {
      setup({ user });
      await userEvent.click(screen.getByRole("button", { name: /Hồ sơ/ }));
      expect(screen.queryByRole("menuitem", { name: "Quản trị" })).toBeNull();
    });

    it("closes on Escape and moves with the arrow keys", async () => {
      setup({ user });
      const trigger = screen.getByRole("button", { name: /Hồ sơ/ });
      await userEvent.click(trigger);
      expect(
        screen.getByRole("menuitem", { name: "Thông tin cá nhân" }),
      ).toHaveFocus();
      await userEvent.keyboard("{ArrowDown}");
      expect(screen.getByRole("menuitem", { name: "Bookmarks" })).toHaveFocus();
      await userEvent.keyboard("{Escape}");
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
    });

    it("closes on a click outside", async () => {
      setup({ user });
      await userEvent.click(screen.getByRole("button", { name: /Hồ sơ/ }));
      await userEvent.click(document.body);
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });

    it("asks for confirmation before logging out", async () => {
      const onLogout = vi.fn();
      setup({ user, onLogout });
      await userEvent.click(screen.getByRole("button", { name: /Hồ sơ/ }));
      await userEvent.click(
        screen.getByRole("menuitem", { name: "Đăng xuất" }),
      );
      expect(onLogout).not.toHaveBeenCalled();

      const dialog = screen.getByRole("alertdialog");
      expect(
        within(dialog).getByText("Đăng xuất khỏi tài khoản?"),
      ).toBeInTheDocument();
      await userEvent.click(
        within(dialog).getByRole("button", { name: "Huỷ" }),
      );
      expect(onLogout).not.toHaveBeenCalled();
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();

      await userEvent.click(screen.getByRole("button", { name: /Hồ sơ/ }));
      await userEvent.click(
        screen.getByRole("menuitem", { name: "Đăng xuất" }),
      );
      await userEvent.click(
        within(screen.getByRole("alertdialog")).getByRole("button", {
          name: "Đăng xuất",
        }),
      );
      expect(onLogout).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });

    it("has no accessibility violations while open", async () => {
      const { container } = setup({ user });
      await userEvent.click(screen.getByRole("button", { name: /Hồ sơ/ }));
      expect(await axe(container)).toHaveNoViolations();
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
      expect(status).toHaveClass("order-2", "ml-auto", "md:order-6");
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

      await userEvent.click(screen.getByRole("button", { name: /Hồ sơ/ }));
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

  it("accepts translated labels", async () => {
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
    await userEvent.click(screen.getByRole("button", { name: "Tài khoản" }));
    expect(
      screen.getByRole("menuitemcheckbox", { name: /Giao diện tối/ }),
    ).toBeInTheDocument();
  });

  describe("project status", () => {
    afterEach(() => {
      pathname.current = "/";
    });

    it("has no Project Status button unless it is given a link", () => {
      setup();
      expect(
        screen.queryByRole("link", { name: "Project Status" }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Khám phá" }),
      ).not.toBeInTheDocument();
    });

    it("is a link with a hard hat to the page it is given", () => {
      setup({ projectStatusHref: "/dashboard" });
      const link = screen.getByRole("link", { name: "Project Status" });
      expect(link).toHaveAttribute("href", "/dashboard");
      expect(link.querySelector("svg")).toHaveClass("lucide-hard-hat");
      expect(link.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
      expect(link).not.toHaveAttribute("aria-current");
    });

    it("marks itself current on its page and deeper paths", () => {
      pathname.current = "/dashboard/anything";
      setup({ projectStatusHref: "/dashboard" });
      expect(
        screen.getByRole("link", { name: "Project Status" }),
      ).toHaveAttribute("aria-current", "page");
    });

    it("can take another label", () => {
      setup({
        projectStatusHref: "/status",
        labels: { projectStatus: "Tiến độ" },
      });
      expect(screen.getByRole("link", { name: "Tiến độ" })).toHaveAttribute(
        "href",
        "/status",
      );
    });
  });

  it("receives ref via props and merges className", () => {
    const ref = createRef<HTMLElement>();
    setup({ ref, className: "custom-class" });
    expect(ref.current).toBe(screen.getByRole("banner"));
    expect(ref.current).toHaveClass("custom-class");
  });

  it("is reachable and operable with the keyboard, in reading order", async () => {
    setup({ unreadNotifications: 1, projectStatusHref: "/dashboard" });
    const order = [
      /^Baolingo$/,
      /^Từ điển$/,
      /^Project Status$/,
      /^Thông báo, có tin chưa đọc$/,
      /^Hồ sơ, 1 mục mới$/,
      /^Facebook Community/,
    ];
    for (const name of order) {
      await userEvent.tab();
      expect(document.activeElement).toHaveAccessibleName(name);
    }
  });

  it("has no accessibility violations, closed and with the account menu open", async () => {
    const { container } = setup({ unreadNotifications: 2, isSticky: true });
    expect(await axe(container)).toHaveNoViolations();
    await userEvent.click(screen.getByRole("button", { name: /Hồ sơ/ }));
    expect(await axe(container)).toHaveNoViolations();
  });
});
