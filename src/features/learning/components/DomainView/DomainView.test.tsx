import { vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import type { LearningDomain } from "../../types";
import { DomainView } from "./DomainView";

expect.extend(toHaveNoViolations);

const domain: LearningDomain = {
  id: "tech",
  label: "Công nghệ",
  icon: "technology",
  categories: [
    {
      id: "programming",
      title: "Lập trình",
      description: "Nền tảng phần mềm.",
      items: [
        {
          id: "js",
          title: "JavaScript",
          description: "Cơ bản.",
          level: "beginner",
          duration: "8 giờ",
          lessons: 32,
        },
        {
          id: "ts",
          title: "TypeScript",
          description: "Kiểu dữ liệu.",
          level: "intermediate",
          duration: "6 giờ",
          lessons: 24,
        },
      ],
    },
    {
      id: "data",
      title: "Dữ liệu",
      items: [
        {
          id: "sql",
          title: "SQL",
          description: "Truy vấn.",
          level: "beginner",
          duration: "5 giờ",
          lessons: 20,
        },
      ],
    },
    {
      id: "devops",
      title: "DevOps",
      items: [
        {
          id: "git",
          title: "Git",
          description: "Nhánh.",
          level: "beginner",
          duration: "3 giờ",
          lessons: 14,
        },
      ],
    },
  ],
};

const section = (id: string) =>
  document.getElementById(`tech-${id}`) as HTMLElement;

// Own properties, so each section gets its own position even though the
// prototype is mocked too (spying on an inherited mock would change them all).
function setTops(tops: Record<string, number>) {
  Object.entries(tops).forEach(([id, top]) =>
    Object.defineProperty(section(id), "getBoundingClientRect", {
      configurable: true,
      value: () => ({ top }) as DOMRect,
    }),
  );
}

describe("DomainView", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
    // jsdom has no layout: put every section below the reading line, as at the top of a page.
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
      top: 1000,
    } as DOMRect);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    Reflect.deleteProperty(Element.prototype, "scrollIntoView");
    Reflect.deleteProperty(window, "matchMedia");
  });

  it("renders the category buttons and a main region with every category in order", () => {
    render(<DomainView domain={domain} />);
    const nav = screen.getByRole("navigation", {
      name: "Phân loại trong lĩnh vực Công nghệ",
    });
    expect(
      within(nav)
        .getAllByRole("button")
        .map((b) => b.textContent),
    ).toEqual(["Lập trình", "Dữ liệu", "DevOps"]);

    const main = screen.getByRole("main");
    expect(
      within(main)
        .getAllByRole("heading", { level: 2 })
        .map((h) => h.textContent),
    ).toEqual(["Lập trình", "Dữ liệu", "DevOps"]);
  });

  it("puts each category's items in a grid right under its heading", () => {
    render(<DomainView domain={domain} />);
    const programming = screen.getByRole("region", { name: "Lập trình" });
    expect(
      within(programming).getByText("Nền tảng phần mềm."),
    ).toBeInTheDocument();
    const list = within(programming).getByRole("list");
    expect(list).toHaveClass("grid");
    expect(within(list).getAllByRole("listitem")).toHaveLength(2);
    expect(
      within(list).getByRole("heading", { level: 3, name: "TypeScript" }),
    ).toBeInTheDocument();

    const data = screen.getByRole("region", { name: "Dữ liệu" });
    expect(within(data).getAllByRole("listitem")).toHaveLength(1);
  });

  it("offsets sections and the nav below the sticky tab bar and the sticky app header", () => {
    render(<DomainView domain={domain} />);
    expect(section("programming")).toHaveClass(
      "scroll-mt-[calc(var(--app-header-height,0px)+7rem)]",
      "md:scroll-mt-[calc(var(--app-header-height,0px)+5rem)]",
    );
    expect(screen.getByRole("navigation")).toHaveClass(
      "sticky",
      "top-[calc(var(--app-header-height,0px)+2.75rem)]",
      "md:top-[calc(var(--app-header-height,0px)+5rem)]",
    );
  });

  it("highlights the first category to start with", () => {
    render(<DomainView domain={domain} />);
    expect(screen.getByRole("button", { name: "Lập trình" })).toHaveAttribute(
      "aria-current",
      "location",
    );
  });

  it("scrolls smoothly to a category and focuses its heading when its button is clicked", async () => {
    render(<DomainView domain={domain} />);
    await userEvent.click(screen.getByRole("button", { name: "DevOps" }));

    expect(section("devops").scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });
    expect(
      screen.getByRole("heading", { level: 2, name: "DevOps" }),
    ).toHaveFocus();
    expect(screen.getByRole("button", { name: "DevOps" })).toHaveAttribute(
      "aria-current",
      "location",
    );
    expect(
      screen.getByRole("button", { name: "Lập trình" }),
    ).not.toHaveAttribute("aria-current");
  });

  it("scrolls without animation when reduced motion is preferred", async () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: true,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia;
    render(<DomainView domain={domain} />);
    await userEvent.click(screen.getByRole("button", { name: "Dữ liệu" }));
    expect(section("data").scrollIntoView).toHaveBeenCalledWith({
      behavior: "auto",
      block: "start",
    });
  });

  it("is operable from the keyboard", async () => {
    render(<DomainView domain={domain} />);
    await userEvent.tab();
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "Dữ liệu" })).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(section("data").scrollIntoView).toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Dữ liệu" })).toHaveFocus();
  });

  it("highlights the button of the section being read as the page scrolls", () => {
    vi.useFakeTimers();
    render(<DomainView domain={domain} />);

    setTops({ programming: -400, data: 0, devops: 700 });
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 400,
    });
    // Not at the bottom of the page.
    Object.defineProperty(document.documentElement, "scrollHeight", {
      configurable: true,
      value: 5000,
    });
    act(() => {
      fireEvent.scroll(window);
      vi.advanceTimersToNextFrame();
    });
    expect(screen.getByRole("button", { name: "Dữ liệu" })).toHaveAttribute(
      "aria-current",
      "location",
    );

    setTops({ programming: -1200, data: -800, devops: 0 });
    act(() => {
      fireEvent.scroll(window);
      vi.advanceTimersToNextFrame();
    });
    expect(screen.getByRole("button", { name: "DevOps" })).toHaveAttribute(
      "aria-current",
      "location",
    );
    expect(screen.getByRole("button", { name: "Dữ liệu" })).not.toHaveAttribute(
      "aria-current",
    );
    vi.useRealTimers();
    Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
    Object.defineProperty(document.documentElement, "scrollHeight", {
      configurable: true,
      value: 0,
    });
  });

  it("merges className", () => {
    const { container } = render(
      <DomainView domain={domain} className="custom-class" />,
    );
    expect(container.firstElementChild).toHaveClass("custom-class", "grid");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<DomainView domain={domain} />);
    // axe measures real geometry; drop the fake layout first.
    vi.restoreAllMocks();
    expect(await axe(container)).toHaveNoViolations();
  });
});
