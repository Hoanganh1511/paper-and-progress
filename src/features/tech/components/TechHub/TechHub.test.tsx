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

  describe("the new design", () => {
    it("shows the chosen group as a lime pill with a black edge", () => {
      render(<TechHub groups={groups} />);
      const chosen = groupTab("Frontend");
      expect(chosen).toHaveClass(
        "aria-selected:bg-accent-lime",
        "aria-selected:border-2",
      );
      expect(chosen.querySelector("svg")).toHaveAttribute(
        "aria-hidden",
        "true",
      );
    });

    it("gives each sub-category tab an icon, over a thick lime line", () => {
      render(<TechHub groups={groups} />);
      const subList = screen.getByRole("tablist", {
        name: "Phân loại trong Frontend",
      });
      expect(subList).toHaveClass("border-accent-lime");
      for (const tab of within(subList).getAllByRole("tab")) {
        expect(tab.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
      }
    });

    it("puts the cards in a white panel with a hard shadow", () => {
      const { container } = render(<TechHub groups={groups} />);
      const panel = container.querySelector(".rounded-\\[1\\.5rem\\]");
      expect(panel).toHaveClass("bg-surface-card", "border-2");
    });

    it("shows a card per technology with the counts from the knowledge base, linking to its topic", () => {
      render(
        <TechHub
          groups={groups}
          counts={{ react: { articles: 2, paths: 1, resources: 3 } }}
        />,
      );
      expect(screen.getByRole("link", { name: "React" })).toHaveAttribute(
        "href",
        "/topics/react",
      );
      expect(screen.getByText("2 bài viết")).toBeInTheDocument();
      expect(screen.getByText("1 lộ trình")).toBeInTheDocument();
      expect(screen.getByText("3 tài liệu")).toBeInTheDocument();
    });

    it("shows zeros, and no link, for a technology the knowledge base does not have", () => {
      render(<TechHub groups={groups} counts={{}} />);
      expect(
        screen.queryByRole("link", { name: "Vue" }),
      ).not.toBeInTheDocument();
      expect(screen.getAllByText("0 bài viết")).toHaveLength(2);
    });

    it("keeps a link of the item's own over the topic page", () => {
      const own: TechGroup[] = [
        {
          ...groups[0],
          subcategories: [
            {
              id: "x",
              label: "Framework",
              items: [
                {
                  id: "nestjs",
                  title: "NestJS",
                  icon: "server",
                  href: "/goals/tech/backend-tutor",
                },
              ],
            },
          ],
        },
      ];
      render(
        <TechHub
          groups={own}
          counts={{ nestjs: { articles: 0, paths: 0, resources: 0 } }}
        />,
      );
      expect(screen.getByRole("link", { name: "NestJS" })).toHaveAttribute(
        "href",
        "/goals/tech/backend-tutor",
      );
    });
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
