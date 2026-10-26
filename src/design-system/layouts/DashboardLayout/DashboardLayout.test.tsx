import { createRef } from "react";
import { render, screen, within } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { Home } from "lucide-react";
import { Button } from "../../components";
import { DashboardLayout, type DashboardLayoutProps } from "./DashboardLayout";

expect.extend(toHaveNoViolations);

function setup(props: Partial<DashboardLayoutProps> = {}) {
  return render(
    <DashboardLayout
      navbar={<span>Brand</span>}
      navItems={[
        { id: "home", label: "Home", href: "/", icon: Home, isActive: true },
      ]}
      title="Projects"
      {...props}
    >
      <p>Page content</p>
    </DashboardLayout>,
  );
}

describe("DashboardLayout", () => {
  it("renders the app shell with the page header and content in main", () => {
    setup({ description: "All your projects" });
    // The PageHeader inside <main> is a <header> too, but not a banner landmark.
    expect(screen.getAllByRole("banner")[0]).toHaveTextContent("Brand");
    const main = screen.getByRole("main");
    expect(
      within(main).getByRole("heading", { level: 1, name: "Projects" }),
    ).toBeInTheDocument();
    expect(within(main).getByText("All your projects")).toBeInTheDocument();
    expect(within(main).getByText("Page content")).toBeInTheDocument();
  });

  it("puts the header before the content", () => {
    setup();
    const heading = screen.getByRole("heading", { name: "Projects" });
    const content = screen.getByText("Page content");
    expect(
      heading.compareDocumentPosition(content) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("renders breadcrumbs and actions in the header", () => {
    setup({
      breadcrumbs: [{ label: "Workspace", href: "/w" }, { label: "Projects" }],
      actions: <Button>New project</Button>,
    });
    const main = screen.getByRole("main");
    expect(
      within(main).getByRole("navigation", { name: "Breadcrumb" }),
    ).toBeInTheDocument();
    expect(
      within(main).getByRole("button", { name: "New project" }),
    ).toBeInTheDocument();
  });

  it("wraps the content in a wide PageContainer by default, or another size", () => {
    const { unmount } = setup();
    expect(screen.getByText("Page content").closest(".mx-auto")).toHaveClass(
      "max-w-[var(--width-container-wide)]",
    );
    unmount();
    setup({ containerSize: "narrow" });
    expect(screen.getByText("Page content").closest(".mx-auto")).toHaveClass(
      "max-w-[var(--width-container-narrow)]",
    );
  });

  it("passes the shell props through", () => {
    const ref = createRef<HTMLDivElement>();
    setup({ ref, className: "custom-class", labels: { openMenu: "Mở menu" } });
    expect(ref.current).toHaveClass("custom-class");
    expect(screen.getByRole("button", { name: "Mở menu" })).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = setup({
      breadcrumbs: [{ label: "Workspace", href: "/w" }, { label: "Projects" }],
      actions: <Button>New project</Button>,
    });
    expect(await axe(container)).toHaveNoViolations();
  });
});
