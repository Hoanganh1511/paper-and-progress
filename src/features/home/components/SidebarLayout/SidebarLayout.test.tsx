import { render, screen, within } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { SidebarLayout } from "./SidebarLayout";

expect.extend(toHaveNoViolations);

const sidebar = <aside aria-label="Bên trái">Menu</aside>;

describe("SidebarLayout", () => {
  it("is the page's one main region, which a skip link can target", () => {
    render(<SidebarLayout sidebar={sidebar}>Nội dung</SidebarLayout>);
    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("id", "main-content");
    expect(main).toHaveAttribute("lang", "vi");
    expect(within(main).getByText("Nội dung")).toBeInTheDocument();
  });

  it("puts the sidebar first, then the page", () => {
    render(
      <SidebarLayout sidebar={sidebar}>
        <p>Nội dung</p>
      </SidebarLayout>,
    );
    const left = screen.getByRole("complementary", { name: "Bên trái" });
    const content = screen.getByText("Nội dung");
    expect(
      left.compareDocumentPosition(content) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("has the sidebar and the page side by side from lg, in one column below", () => {
    const { container } = render(
      <SidebarLayout sidebar={sidebar}>Nội dung</SidebarLayout>,
    );
    const grid = container.querySelector("main > div");
    expect(grid).toHaveClass("grid", "lg:grid-cols-[18rem_minmax(0,1fr)]");
    expect(screen.getByText("Nội dung")).toHaveClass("min-w-0");
    // A wide gap between the sidebar and the page, wider still from xl.
    expect(grid).toHaveClass("gap-6", "lg:gap-x-10", "xl:gap-x-12");
  });

  it("merges className", () => {
    render(
      <SidebarLayout sidebar={sidebar} className="custom-class">
        Nội dung
      </SidebarLayout>,
    );
    expect(screen.getByRole("main")).toHaveClass("custom-class");
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <SidebarLayout sidebar={sidebar}>
        <h1>Tiêu đề</h1>
      </SidebarLayout>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
