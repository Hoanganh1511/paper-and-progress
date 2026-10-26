import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { Button } from "../../components";
import { PageHeader } from "./PageHeader";

expect.extend(toHaveNoViolations);

describe("PageHeader", () => {
  it("renders the title as an h1 with a description", () => {
    render(<PageHeader title="Projects" description="All your projects" />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Projects" }),
    ).toBeInTheDocument();
    expect(screen.getByText("All your projects")).toBeInTheDocument();
  });

  it("renders breadcrumbs above the title", () => {
    render(
      <PageHeader
        title="Atlas"
        breadcrumbs={[
          { label: "Projects", href: "/projects" },
          { label: "Atlas" },
        ]}
      />,
    );
    const nav = screen.getByRole("navigation", { name: "Breadcrumb" });
    const heading = screen.getByRole("heading", { name: "Atlas" });
    expect(
      nav.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.getByRole("link", { name: "Projects" })).toHaveAttribute(
      "href",
      "/projects",
    );
  });

  it("passes breadcrumb props through", () => {
    render(
      <PageHeader
        title="Atlas"
        breadcrumbs={[{ label: "Atlas" }]}
        breadcrumbsProps={{ label: "Đường dẫn" }}
      />,
    );
    expect(
      screen.getByRole("navigation", { name: "Đường dẫn" }),
    ).toBeInTheDocument();
  });

  it("omits breadcrumbs when there are none", () => {
    render(<PageHeader title="Projects" breadcrumbs={[]} />);
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("renders the actions", () => {
    render(
      <PageHeader title="Projects" actions={<Button>New project</Button>} />,
    );
    expect(
      screen.getByRole("button", { name: "New project" }),
    ).toBeInTheDocument();
  });

  it("receives ref via props and merges className", () => {
    const ref = createRef<HTMLElement>();
    render(<PageHeader title="x" ref={ref} className="custom-class" />);
    expect(ref.current).toBeInstanceOf(HTMLElement);
    expect(ref.current).toHaveClass("custom-class");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <PageHeader
        title="Atlas"
        description="Details"
        breadcrumbs={[
          { label: "Projects", href: "/projects" },
          { label: "Atlas" },
        ]}
        actions={<Button>Edit</Button>}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
