import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import type { TechGroup } from "../../types";
import { TechHub } from "./TechHub";

expect.extend(toHaveNoViolations);

const groups: TechGroup[] = [
  {
    id: "frontend",
    label: "Frontend",
    icon: "frontend",
    subcategories: [
      {
        id: "fe-framework",
        label: "Framework",
        items: [
          { id: "react", title: "React", icon: "code" },
          { id: "vue", title: "Vue", icon: "code" },
        ],
      },
      {
        id: "fe-styling",
        label: "Giao diện",
        items: [{ id: "css", title: "CSS", icon: "design" }],
      },
    ],
  },
  {
    id: "backend",
    label: "Backend",
    icon: "backend",
    subcategories: [
      {
        id: "be-runtime",
        label: "Runtime",
        items: [{ id: "nodejs", title: "Node.js", icon: "terminal" }],
      },
    ],
  },
];

const groupTab = (name: string) => screen.getByRole("tab", { name });

describe("TechHub", () => {
  it("renders a pill tab per group, the first selected", () => {
    render(<TechHub groups={groups} />);
    const groupList = screen.getByRole("tablist", { name: "Nhóm kiến thức" });
    expect(
      within(groupList)
        .getAllByRole("tab")
        .map((t) => t.textContent),
    ).toEqual(["Frontend", "Backend"]);
    expect(groupTab("Frontend")).toHaveAttribute("aria-selected", "true");
  });

  it("shows the selected group's sub-category tabs and its first grid", () => {
    render(<TechHub groups={groups} />);
    const subList = screen.getByRole("tablist", {
      name: "Phân loại trong Frontend",
    });
    expect(
      within(subList)
        .getAllByRole("tab")
        .map((t) => t.textContent),
    ).toEqual(["Framework", "Giao diện"]);
    expect(
      screen.getByRole("heading", { level: 3, name: "React" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("CSS")).not.toBeInTheDocument();
  });

  it("switches the grid when a sub-category is chosen", async () => {
    render(<TechHub groups={groups} />);
    await userEvent.click(screen.getByRole("tab", { name: "Giao diện" }));
    expect(screen.getByText("CSS")).toBeInTheDocument();
    expect(screen.queryByText("React")).not.toBeInTheDocument();
  });

  it("resets to the first sub-category when the group changes", async () => {
    render(<TechHub groups={groups} />);
    await userEvent.click(screen.getByRole("tab", { name: "Giao diện" }));
    expect(screen.getByText("CSS")).toBeInTheDocument();

    await userEvent.click(groupTab("Backend"));
    expect(screen.getByText("Node.js")).toBeInTheDocument();

    await userEvent.click(groupTab("Frontend"));
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.queryByText("CSS")).not.toBeInTheDocument();
  });

  it("shows only the selected group's content", () => {
    render(<TechHub groups={groups} />);
    expect(screen.queryByText("Node.js")).not.toBeInTheDocument();
  });

  it("opens on the requested group", () => {
    render(<TechHub groups={groups} defaultGroupId="backend" />);
    expect(groupTab("Backend")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Node.js")).toBeInTheDocument();
  });

  it("accepts a custom group tab list label", () => {
    render(<TechHub groups={groups} groupsLabel="Knowledge groups" />);
    expect(
      screen.getByRole("tablist", { name: "Knowledge groups" }),
    ).toBeInTheDocument();
  });

  it("copes with no groups", () => {
    render(<TechHub groups={[]} />);
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
  });

  it("merges className", () => {
    const { container } = render(
      <TechHub groups={groups} className="custom-class" />,
    );
    expect(container.firstElementChild).toHaveClass("custom-class");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<TechHub groups={groups} />);
    expect(await axe(container)).toHaveNoViolations();
    await userEvent.click(groupTab("Backend"));
    expect(await axe(container)).toHaveNoViolations();
  });
});
