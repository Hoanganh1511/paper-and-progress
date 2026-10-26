import { vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
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

const tab = (name: string) => screen.getByRole("tab", { name });

describe("LearningHub", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
    window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
    // jsdom has no layout: put every section below the reading line, as at the top of a page.
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
      top: 1000,
    } as DOMRect);
  });
  afterEach(() => {
    vi.restoreAllMocks();
    Reflect.deleteProperty(Element.prototype, "scrollIntoView");
    Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
  });

  it("renders a horizontal tab bar with one tab per domain and the first selected", () => {
    render(<LearningHub domains={domains} />);
    expect(
      screen.getByRole("tablist", { name: "Lĩnh vực học tập" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("tab").map((t) => t.textContent)).toEqual([
      "Công nghệ",
      "Tài chính",
      "Sức khỏe",
    ]);
    expect(tab("Công nghệ")).toHaveAttribute("aria-selected", "true");
    expect(tab("Tài chính")).toHaveAttribute("aria-selected", "false");
  });

  it("hides the tab icons from assistive technology and names the page with an h1", () => {
    render(<LearningHub domains={domains} />);
    screen
      .getAllByRole("tab")
      .forEach((t) =>
        expect(t.querySelector("svg")).toHaveAttribute("aria-hidden", "true"),
      );
    expect(
      screen.getByRole("heading", { level: 1, name: "Học tập theo lĩnh vực" }),
    ).toBeInTheDocument();
  });

  it("shows the sidebar and sections of the selected domain only", () => {
    render(<LearningHub domains={domains} />);
    const nav = screen.getByRole("navigation", {
      name: "Phân loại trong lĩnh vực Công nghệ",
    });
    expect(within(nav).getAllByRole("button")).toHaveLength(2);
    expect(
      screen.getByRole("heading", { level: 2, name: "Lập trình" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "JavaScript" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Đầu tư" }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole("main")).toHaveLength(1);
  });

  it("swaps the whole content when another tab is chosen, and goes back to the top", async () => {
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 600,
    });
    render(<LearningHub domains={domains} />);
    await userEvent.click(tab("Tài chính"));

    expect(tab("Tài chính")).toHaveAttribute("aria-selected", "true");
    expect(
      screen.getByRole("navigation", {
        name: "Phân loại trong lĩnh vực Tài chính",
      }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("main"))
        .getAllByRole("heading", { level: 2 })
        .map((h) => h.textContent),
    ).toEqual(["Đầu tư", "Thuế", "Ngân sách"]);
    expect(
      screen.queryByRole("heading", { name: "Lập trình" }),
    ).not.toBeInTheDocument();
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "auto" });
  });

  it("does not scroll when it is already at the top", async () => {
    render(<LearningHub domains={domains} />);
    await userEvent.click(tab("Sức khỏe"));
    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it("starts the new domain on its first category", async () => {
    render(<LearningHub domains={domains} />);
    await userEvent.click(screen.getByRole("button", { name: "DevOps" }));
    expect(screen.getByRole("button", { name: "DevOps" })).toHaveAttribute(
      "aria-current",
      "location",
    );

    await userEvent.click(tab("Tài chính"));
    expect(screen.getByRole("button", { name: "Đầu tư" })).toHaveAttribute(
      "aria-current",
      "location",
    );
  });

  it("scrolls to a category from the sidebar of whichever domain is open", async () => {
    render(<LearningHub domains={domains} />);
    await userEvent.click(tab("Tài chính"));
    await userEvent.click(screen.getByRole("button", { name: "Ngân sách" }));
    const section = document.getElementById("finance-budget") as HTMLElement;
    expect(section.scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });
  });

  it("switches tabs with the arrow keys", async () => {
    render(<LearningHub domains={domains} />);
    await userEvent.tab();
    expect(tab("Công nghệ")).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    expect(tab("Tài chính")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("heading", { name: "Đầu tư" })).toBeInTheDocument();
  });

  it("opens on the requested domain", () => {
    render(<LearningHub domains={domains} defaultDomainId="health" />);
    expect(tab("Sức khỏe")).toHaveAttribute("aria-selected", "true");
    expect(
      screen.getByRole("heading", { name: "Giấc ngủ" }),
    ).toBeInTheDocument();
  });

  it("sticks the tab bar just beneath a sticky app header", () => {
    render(<LearningHub domains={domains} />);
    expect(screen.getByRole("tablist").closest(".sticky")).toHaveClass(
      "top-[var(--app-header-height,0px)]",
    );
  });

  it("has a main region that a skip link can target", () => {
    render(<LearningHub domains={domains} />);
    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
  });

  it("declares its Vietnamese content with lang=vi", () => {
    const { container } = render(<LearningHub domains={domains} />);
    expect(container.firstElementChild).toHaveAttribute("lang", "vi");
  });

  it("copes with an empty catalogue", () => {
    render(<LearningHub domains={[]} />);
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
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
    await userEvent.click(tab("Tài chính"));
    expect(await axe(container)).toHaveNoViolations();
  });
});
