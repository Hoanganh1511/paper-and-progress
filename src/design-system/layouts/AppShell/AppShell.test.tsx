import { createRef, type ReactNode } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { Home, Settings, Users, BarChart3, Folder, Bell } from "lucide-react";
import { AppShell, type AppShellProps } from "./AppShell";

expect.extend(toHaveNoViolations);

const navItems = [
  { id: "home", label: "Home", href: "/", icon: Home, isActive: true },
  { id: "projects", label: "Projects", href: "/projects", icon: Folder },
  { id: "team", label: "Team", href: "/team", icon: Users },
  { id: "reports", label: "Reports", href: "/reports", icon: BarChart3 },
  { id: "alerts", label: "Alerts", href: "/alerts", icon: Bell },
  { id: "settings", label: "Settings", href: "/settings", icon: Settings },
];

function setup(props: Partial<AppShellProps> = {}) {
  return render(
    <AppShell
      navbar={<span>Paper &amp; Progress</span>}
      navItems={navItems}
      {...props}
    >
      <h1>Dashboard</h1>
    </AppShell>,
  );
}

const sidebar = () =>
  screen.getAllByRole("navigation", { name: "Main navigation" })[0];
const quickNav = () =>
  screen.getByRole("navigation", { name: "Quick navigation" });

describe("AppShell", () => {
  it("renders the skip link, banner, sidebar nav, main and bottom nav", () => {
    setup();
    expect(
      screen.getByRole("link", { name: "Skip to main content" }),
    ).toHaveAttribute("href", "#main-content");
    expect(screen.getByRole("banner")).toHaveTextContent("Paper & Progress");
    expect(sidebar()).toBeInTheDocument();
    expect(quickNav()).toBeInTheDocument();
    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("id", "main-content");
    expect(
      within(main).getByRole("heading", { name: "Dashboard" }),
    ).toBeInTheDocument();
  });

  it("lays out a grid: top bar over an icon-only then full sidebar and the main area", () => {
    const { container } = setup();
    expect(container.firstElementChild).toHaveClass(
      "grid",
      "grid-cols-1",
      "md:grid-cols-[4rem_1fr]",
      "lg:grid-cols-[16rem_1fr]",
    );
    expect(screen.getByRole("banner")).toHaveClass("md:col-span-2");
    // Above sticky content below it, so menus in the navbar are not covered.
    expect(screen.getByRole("banner")).toHaveClass("z-[var(--z-dropdown)]");
    expect(sidebar().parentElement).toHaveClass("hidden", "md:flex");
    expect(quickNav()).toHaveClass("md:hidden");
  });

  it("lists every item in the sidebar, marking the current page", () => {
    setup();
    const links = within(sidebar()).getAllByRole("link");
    expect(links).toHaveLength(6);
    expect(
      within(sidebar()).getByRole("link", { name: "Home" }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      within(sidebar()).getByRole("link", { name: "Team" }),
    ).not.toHaveAttribute("aria-current");
  });

  it("collapses the sidebar labels to screen-reader text on tablet, keeping the names", () => {
    setup();
    const label = within(sidebar()).getByText("Projects");
    expect(label).toHaveClass("md:sr-only", "lg:not-sr-only");
    expect(
      within(sidebar()).getByRole("link", { name: "Projects" }),
    ).toBeInTheDocument();
  });

  it("puts only the first few items in the bottom bar", () => {
    const { unmount } = setup();
    expect(within(quickNav()).getAllByRole("link")).toHaveLength(5);
    expect(
      within(quickNav()).queryByRole("link", { name: "Settings" }),
    ).not.toBeInTheDocument();
    unmount();
    setup({ bottomNavLimit: 3 });
    expect(within(quickNav()).getAllByRole("link")).toHaveLength(3);
  });

  it("marks the current page in the bottom bar too", () => {
    setup();
    expect(
      within(quickNav()).getByRole("link", { name: "Home" }),
    ).toHaveAttribute("aria-current", "page");
  });

  it("opens the full navigation in a drawer from the menu button and closes it", async () => {
    setup();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Open menu" }));
    const drawer = screen.getByRole("dialog", { name: "Menu" });
    expect(within(drawer).getAllByRole("link")).toHaveLength(6);
    expect(within(drawer).getByText("Projects")).not.toHaveClass("md:sr-only");

    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open menu" })).toHaveFocus();
  });

  it("closes the drawer when a link is chosen", async () => {
    setup();
    await userEvent.click(screen.getByRole("button", { name: "Open menu" }));
    await userEvent.click(
      within(screen.getByRole("dialog")).getByRole("link", { name: "Team" }),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows the sidebar header and footer in the sidebar and in the drawer", async () => {
    setup({
      sidebarHeader: <p>Workspace</p>,
      sidebarFooter: <p>Signed in as Ann</p>,
    });
    expect(screen.getAllByText("Workspace")).toHaveLength(1);
    await userEvent.click(screen.getByRole("button", { name: "Open menu" }));
    expect(screen.getAllByText("Workspace")).toHaveLength(2);
    expect(screen.getAllByText("Signed in as Ann")).toHaveLength(2);
  });

  it("renders links with a custom link component", () => {
    function CustomLink({
      href,
      children,
      ...rest
    }: {
      href: string;
      className?: string;
      children?: ReactNode;
    }) {
      return (
        <a href={href} data-custom="true" {...rest}>
          {children}
        </a>
      );
    }
    setup({ linkComponent: CustomLink });
    within(sidebar())
      .getAllByRole("link")
      .forEach((link) => expect(link).toHaveAttribute("data-custom", "true"));
  });

  it("accepts translated labels", () => {
    setup({
      labels: {
        skipToContent: "Bỏ qua",
        openMenu: "Mở menu",
        mainNavigation: "Điều hướng chính",
      },
    });
    expect(screen.getByRole("link", { name: "Bỏ qua" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mở menu" })).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Điều hướng chính" }),
    ).toBeInTheDocument();
  });

  it("receives ref via props and merges className", () => {
    const ref = createRef<HTMLDivElement>();
    setup({ ref, className: "custom-class" });
    expect(ref.current).toHaveClass("grid", "custom-class");
  });

  it("has no accessibility violations, with the drawer open too", async () => {
    const { container } = setup({ sidebarHeader: <p>Workspace</p> });
    expect(await axe(container)).toHaveNoViolations();
    await userEvent.click(screen.getByRole("button", { name: "Open menu" }));
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
