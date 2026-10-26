import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import type { EnglishTab, EnglishTopic } from "../../types";
import { EnglishGoals } from "./EnglishGoals";

expect.extend(toHaveNoViolations);

const card = (
  id: string,
  title: string,
  color: EnglishTopic["color"],
): EnglishTopic => ({
  id,
  title,
  description: `Mô tả cho thẻ ${title} khá dài để đủ chữ.`,
  icon: "exam",
  color,
  mascot: "book",
  badge: "10 BÀI",
  decor: ["star", "note"],
});

const tabs: EnglishTab[] = [
  {
    id: "exams",
    label: "Luyện thi",
    sections: [
      {
        id: "certificates",
        title: "Chứng chỉ quốc tế",
        description: "Chọn kỳ thi đúng với mục tiêu.",
        topics: [
          card("ielts", "IELTS", "blue"),
          card("toeic", "TOEIC", "green"),
          card("toefl", "TOEFL", "orange"),
        ],
      },
      {
        id: "school",
        title: "Thi trong nhà trường",
        topics: [
          card("thpt", "Tốt nghiệp THPT", "pink"),
          card("l10", "Vào lớp 10", "purple"),
        ],
      },
    ],
  },
  {
    id: "skills",
    label: "Bốn kỹ năng",
    sections: [
      {
        id: "core",
        title: "Kỹ năng nền tảng",
        topics: [
          card("listening", "Nghe", "blue"),
          card("speaking", "Nói", "pink"),
        ],
      },
    ],
  },
];

const tab = (name: string) => screen.getByRole("tab", { name });

describe("EnglishGoals", () => {
  it("renders a pill tab bar with one tab per group, the first selected", () => {
    render(<EnglishGoals tabs={tabs} />);
    expect(
      screen.getByRole("tablist", { name: "Nhóm mục tiêu tiếng Anh" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("tab").map((t) => t.textContent)).toEqual([
      "Luyện thi",
      "Bốn kỹ năng",
    ]);
    expect(tab("Luyện thi")).toHaveAttribute("aria-selected", "true");
    expect(tab("Luyện thi")).toHaveClass("aria-selected:bg-accent-lime");
  });

  it("shows each section of the selected tab as a titled carousel of cards", () => {
    render(<EnglishGoals tabs={tabs} />);
    const headings = screen.getAllByRole("heading", { level: 2 });
    expect(headings.map((h) => h.textContent)).toEqual([
      "Chứng chỉ quốc tế",
      "Thi trong nhà trường",
    ]);

    const carousel = screen.getByRole("region", { name: "Chứng chỉ quốc tế" });
    expect(carousel).toHaveAttribute("aria-roledescription", "carousel");
    expect(within(carousel).getAllByRole("article")).toHaveLength(3);
    expect(
      within(carousel).getByRole("heading", { level: 3, name: "TOEIC" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Chọn kỳ thi đúng với mục tiêu."),
    ).toBeInTheDocument();
  });

  it("names the slides in Vietnamese", () => {
    render(<EnglishGoals tabs={tabs} />);
    const carousel = screen.getByRole("region", { name: "Chứng chỉ quốc tế" });
    const slides = within(carousel).getAllByRole("group", { name: /trên 3/ });
    expect(slides.map((s) => s.getAttribute("aria-label"))).toEqual([
      "1 trên 3",
      "2 trên 3",
      "3 trên 3",
    ]);
  });

  it("shows only the selected tab's content", () => {
    render(<EnglishGoals tabs={tabs} />);
    expect(
      screen.queryByRole("heading", { name: "Kỹ năng nền tảng" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Nghe" }),
    ).not.toBeInTheDocument();
  });

  it("switches the whole content when another tab is chosen", async () => {
    render(<EnglishGoals tabs={tabs} />);
    await userEvent.click(tab("Bốn kỹ năng"));
    expect(tab("Bốn kỹ năng")).toHaveAttribute("aria-selected", "true");
    expect(
      screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent),
    ).toEqual(["Kỹ năng nền tảng"]);
    expect(
      screen.getByRole("heading", { level: 3, name: "Nghe" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "IELTS" }),
    ).not.toBeInTheDocument();
  });

  it("switches tabs with the arrow keys", async () => {
    render(<EnglishGoals tabs={tabs} />);
    await userEvent.tab();
    expect(tab("Luyện thi")).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    expect(tab("Bốn kỹ năng")).toHaveAttribute("aria-selected", "true");
    expect(
      screen.getByRole("region", { name: "Kỹ năng nền tảng" }),
    ).toBeInTheDocument();
  });

  it("opens on the requested tab", () => {
    render(<EnglishGoals tabs={tabs} defaultTabId="skills" />);
    expect(tab("Bốn kỹ năng")).toHaveAttribute("aria-selected", "true");
    expect(
      screen.getByRole("heading", { name: "Kỹ năng nền tảng" }),
    ).toBeInTheDocument();
  });

  it("accepts a custom tab list label", () => {
    render(<EnglishGoals tabs={tabs} tabsLabel="English goals" />);
    expect(
      screen.getByRole("tablist", { name: "English goals" }),
    ).toBeInTheDocument();
  });

  it("copes with no tabs", () => {
    render(<EnglishGoals tabs={[]} />);
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
  });

  it("merges className", () => {
    const { container } = render(
      <EnglishGoals tabs={tabs} className="custom-class" />,
    );
    expect(container.firstElementChild).toHaveClass("custom-class");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<EnglishGoals tabs={tabs} />);
    expect(await axe(container)).toHaveNoViolations();
    await userEvent.click(tab("Bốn kỹ năng"));
    expect(await axe(container)).toHaveNoViolations();
  });
});
