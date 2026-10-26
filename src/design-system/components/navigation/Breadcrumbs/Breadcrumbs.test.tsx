import { createRef, type ReactNode } from "react";
import { render, screen, within } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { Breadcrumbs } from "./Breadcrumbs";

expect.extend(toHaveNoViolations);

const items = [
  { label: "Home", href: "/" },
  { label: "Projects", href: "/projects" },
  { label: "Atlas" },
];

describe("Breadcrumbs", () => {
  it("renders a labelled navigation with an ordered list", () => {
    render(<Breadcrumbs items={items} />);
    const nav = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(within(nav).getByRole("list").tagName).toBe("OL");
    expect(within(nav).getAllByRole("listitem")).toHaveLength(3);
  });

  it("links every item but the last, which is the current page", () => {
    render(<Breadcrumbs items={items} />);
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("link", { name: "Projects" })).toHaveAttribute(
      "href",
      "/projects",
    );
    expect(screen.getAllByRole("link")).toHaveLength(2);
    expect(screen.getByText("Atlas")).toHaveAttribute("aria-current", "page");
  });

  it("treats items without an href as text and makes a linked last item text too", () => {
    render(
      <Breadcrumbs
        items={[{ label: "Settings" }, { label: "Profile", href: "/profile" }]}
      />,
    );
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("Profile")).toHaveAttribute("aria-current", "page");
  });

  it("hides the separators from assistive technology", () => {
    const { container } = render(<Breadcrumbs items={items} />);
    const separators = container.querySelectorAll("svg");
    expect(separators).toHaveLength(2);
    separators.forEach((separator) =>
      expect(separator).toHaveAttribute("aria-hidden", "true"),
    );
  });

  it("accepts a custom label and link component", () => {
    function CustomLink({
      href,
      children,
    }: {
      href: string;
      className?: string;
      children?: ReactNode;
    }) {
      return (
        <a href={href} data-custom="true">
          {children}
        </a>
      );
    }
    render(
      <Breadcrumbs
        items={items}
        label="Đường dẫn"
        linkComponent={CustomLink}
      />,
    );
    expect(
      screen.getByRole("navigation", { name: "Đường dẫn" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute(
      "data-custom",
      "true",
    );
  });

  it("receives ref via props and merges className", () => {
    const ref = createRef<HTMLElement>();
    render(<Breadcrumbs items={items} ref={ref} className="custom-class" />);
    expect(ref.current).toBe(screen.getByRole("navigation"));
    expect(ref.current).toHaveClass("custom-class");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Breadcrumbs items={items} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
