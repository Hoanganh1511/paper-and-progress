import { vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import type { LearningDomain } from "../../types";
import { LearningHub } from "./LearningHub";

expect.extend(toHaveNoViolations);

const item = (id: string, title: string) => ({
  id,
  title,
  description: `Mô tả ${title}.`,
  level: "beginner" as const,
  duration: "2 giờ",
  lessons: 8,
});

const domains: LearningDomain[] = [
  {
    id: "technology",
    label: "Công nghệ",
    icon: "technology",
    categories: [
      {
        id: "programming",
        title: "Lập trình",
        items: [item("js", "JavaScript")],
      },
      { id: "devops", title: "DevOps", items: [item("git", "Git")] },
    ],
  },
  {
    id: "finance",
    label: "Tài chính",
    icon: "finance",
    categories: [
      { id: "investing", title: "Đầu tư", items: [item("etf", "Quỹ chỉ số")] },
      { id: "tax", title: "Thuế", items: [item("pit", "Thuế thu nhập")] },
      {
        id: "budget",
        title: "Ngân sách",
        items: [item("plan", "Lập ngân sách")],
      },
    ],
  },
  {
    id: "health",
    label: "Sức khỏe",
    icon: "health",
    categories: [
      { id: "sleep", title: "Giấc ngủ", items: [item("rest", "Ngủ ngon")] },
    ],
  },
];

describe("LearningHub: with articles, two folder tabs", () => {
  const articles = (
    <section aria-label="Danh sách bài">Bài viết nổi bật</section>
  );

  afterEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("has the tabs Bài viết and Techstack, and starts on Bài viết", () => {
    render(<LearningHub domains={domains} articles={articles} />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      "Bài viết",
      "Techstack",
    ]);
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("region", { name: "Danh sách bài" })).toBeVisible();
    // The domains are on the page already, only hidden.
    const [, techstack] = screen.getAllByRole("tabpanel", { hidden: true });
    expect(techstack).toHaveAttribute("hidden");
    expect(
      screen.queryByRole("heading", { level: 2, name: "Công nghệ" }),
    ).not.toBeInTheDocument();
  });

  it("is a folder: the tabs and the panel share one tablist and panel", () => {
    render(<LearningHub domains={domains} articles={articles} />);
    expect(
      screen.getByRole("tablist", { name: "Nội dung của thư viện" }),
    ).toBeInTheDocument();
    // The open tab is lime; the lime band along the top of the panel is what it runs into.
    expect(screen.getByRole("tab", { name: "Bài viết" })).toHaveClass(
      "aria-selected:bg-accent-lime",
    );
    expect(
      document.querySelector(".bg-accent-lime[aria-hidden='true']"),
    ).not.toBeNull();
  });

  it("shows every domain under Techstack, and hides the articles", async () => {
    render(<LearningHub domains={domains} articles={articles} />);
    await userEvent.click(screen.getByRole("tab", { name: "Techstack" }));
    expect(
      screen
        .getAllByRole("heading", { level: 2 })
        .map((h) => h.textContent)
        .filter((text) =>
          ["Công nghệ", "Tài chính", "Sức khỏe"].includes(text ?? ""),
        ),
    ).toEqual(["Công nghệ", "Tài chính", "Sức khỏe"]);
    expect(
      screen.queryByRole("region", { name: "Danh sách bài" }),
    ).not.toBeInTheDocument();
  });

  it("keeps the tab in the address, without loading another page", async () => {
    const replace = vi.spyOn(window.history, "replaceState");
    render(<LearningHub domains={domains} articles={articles} />);
    await userEvent.click(screen.getByRole("tab", { name: "Techstack" }));
    expect(window.location.search).toBe("?tab=techstack");
    await userEvent.click(screen.getByRole("tab", { name: "Bài viết" }));
    expect(window.location.search).toBe("");
    expect(replace).toHaveBeenCalledTimes(2);
  });

  it("can open on Techstack", () => {
    render(
      <LearningHub
        domains={domains}
        articles={articles}
        defaultTab="techstack"
      />,
    );
    expect(screen.getByRole("tab", { name: "Techstack" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(
      screen.getByRole("heading", { level: 2, name: "Công nghệ" }),
    ).toBeInTheDocument();
  });

  it("moves between the tabs with the arrow keys", async () => {
    render(<LearningHub domains={domains} articles={articles} />);
    screen.getByRole("tab", { name: "Bài viết" }).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Techstack" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <LearningHub domains={domains} articles={articles} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("LearningHub: domains on their own", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
    // jsdom has no layout: put every section below the reading line, as at the top of a page.
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
      top: 1000,
    } as DOMRect);
  });
  afterEach(() => {
    vi.restoreAllMocks();
    Reflect.deleteProperty(Element.prototype, "scrollIntoView");
  });

  it("has no tabs: every domain is a section on the same page", () => {
    render(<LearningHub domains={domains} />);
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    expect(
      screen
        .getAllByRole("heading", { level: 2 })
        .map((h) => h.textContent)
        .filter((text) =>
          ["Công nghệ", "Tài chính", "Sức khỏe"].includes(text ?? ""),
        ),
    ).toEqual(["Công nghệ", "Tài chính", "Sức khỏe"]);
  });

  it("hides the domain icons from assistive technology", () => {
    render(<LearningHub domains={domains} />);
    const icons = document.querySelectorAll("h2 svg, section > div svg");
    for (const icon of icons) {
      expect(icon).toHaveAttribute("aria-hidden", "true");
    }
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(
      domains.length,
    );
  });

  it("shows the first category of every domain, with its topics, and the other categories as buttons", () => {
    render(<LearningHub domains={domains} />);
    for (const name of ["Lập trình", "Đầu tư", "Giấc ngủ"]) {
      expect(
        screen.getByRole("heading", { level: 3, name }),
      ).toBeInTheDocument();
    }
    expect(
      screen.getByRole("heading", { level: 4, name: "JavaScript" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", {
        name: "Phân loại trong lĩnh vực Tài chính",
      }),
    ).toBeInTheDocument();
    // Only the chosen category's topics are shown.
    expect(
      screen.queryByRole("heading", { level: 4, name: "Git" }),
    ).not.toBeInTheDocument();
  });

  it("swaps the topics in place when another category is chosen", async () => {
    render(<LearningHub domains={domains} />);
    await userEvent.click(screen.getByRole("button", { name: "DevOps" }));
    expect(
      screen.getByRole("heading", { level: 4, name: "Git" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { level: 4, name: "JavaScript" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "DevOps" })).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  it("declares its Vietnamese content with lang=vi", () => {
    const { container } = render(<LearningHub domains={domains} />);
    expect(container.firstElementChild).toHaveAttribute("lang", "vi");
  });

  it("copes with an empty catalogue", () => {
    render(<LearningHub domains={[]} />);
    expect(document.querySelectorAll("h2")).toHaveLength(0);
  });

  it("merges className", () => {
    const { container } = render(
      <LearningHub domains={domains} className="custom-class" />,
    );
    expect(container.firstElementChild).toHaveClass("custom-class");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<LearningHub domains={domains} />);
    // axe measures real geometry; drop the fake layout first.
    vi.restoreAllMocks();
    expect(await axe(container)).toHaveNoViolations();
  });
});
