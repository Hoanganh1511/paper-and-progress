import { vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import type { ArticleCardData } from "@/features/articles";

expect.extend(toHaveNoViolations);

const fetchArticleList = vi.hoisted(() => vi.fn());
vi.mock("@/features/articles", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/articles")>()),
  fetchArticleList,
}));

let isMember: boolean | undefined = false;
vi.mock("@/features/membership", () => ({ useIsMember: () => isMember }));

import { LibraryArticles } from "./LibraryArticles";
import {
  LIBRARY_ARTICLE_COUNT,
  LibraryArticlesSection,
} from "./LibraryArticlesSection";

const article = (
  n: number,
  overrides: Partial<ArticleCardData> = {},
): ArticleCardData => ({
  id: `a${n}`,
  slug: `bai-${n}`,
  title: `Bài viết số ${n}`,
  excerpt: `Tóm tắt ${n}`,
  coverImageUrl: null,
  readingMinutes: 4,
  visibility: "PUBLIC",
  status: "PUBLISHED",
  publishedAt: "2026-10-27T08:00:00.000Z",
  viewCount: 10,
  seriesOrder: null,
  author: { id: "u1", displayName: "AnhHT" },
  tags: [],
  series: null,
  ...overrides,
});

describe("LibraryArticles", () => {
  beforeEach(() => {
    isMember = false;
  });

  it("has a header with the icon's title, the description and the way to every article", () => {
    render(<LibraryArticles articles={[article(1)]} />);
    const section = screen.getByRole("region", { name: "Bài viết" });
    expect(
      within(section).getByRole("heading", { level: 2, name: "Bài viết" }),
    ).toBeInTheDocument();
    expect(
      within(section).getByText(
        "Ghi chép về học tập, lập trình và những gì mình học được mỗi ngày.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Xem tất cả bài viết" }),
    ).not.toBeInTheDocument();
  });

  it("shows on each card the title, summary, author, date and reading time", () => {
    render(<LibraryArticles articles={[article(1)]} />);
    const card = screen.getByRole("article");
    expect(
      within(card).getByRole("link", { name: "Bài viết số 1" }),
    ).toHaveAttribute("href", "/articles/bai-1");
    expect(within(card).getByText("Tóm tắt 1")).toBeInTheDocument();
    expect(within(card).getByText("AnhHT")).toBeInTheDocument();
    expect(within(card).getByText("27/10/2026")).toBeInTheDocument();
    expect(within(card).getByText("4 phút đọc")).toBeInTheDocument();
  });

  describe("the card's design", () => {
    const three = [article(1), article(2), article(3)];

    it("has an accent colour per card: pink, lime, violet, in that order", () => {
      render(<LibraryArticles articles={three} />);
      const accents = screen
        .getAllByRole("article")
        .map((card) => card.style.getPropertyValue("--accent"));
      expect(accents).toEqual(["#ff4f9a", "#c7f500", "#b66bff"]);
    });

    it("stays white with a black border, and puts the accent in a shadow with a black layer behind", () => {
      render(<LibraryArticles articles={three} />);
      const card = screen.getAllByRole("article")[0];
      expect(card).toHaveClass(
        "bg-white",
        "border-2",
        "border-[#171717]",
        "rounded-[1.5rem]",
        "min-h-[19.5rem]",
      );
      expect(card.className).toContain(
        "shadow-[8px_9px_0_0_var(--accent),11px_12px_0_0_#171717]",
      );
      // No blur: every shadow has a 0 blur radius.
      expect(card.className).not.toMatch(/shadow-\[[^\]]*\d+px_\d+px_[1-9]/);
    });

    it("shows the accent in at least three more places than the shadow: the line, the drawing and the bar", () => {
      render(<LibraryArticles articles={three} />);
      const card = screen.getAllByRole("article")[0];
      expect(card.querySelector("[data-accent-line]")?.className).toContain(
        "bg-[var(--accent)]",
      );
      expect(
        card.querySelector("[data-illustration] path[fill='#ff4f9a']"),
      ).not.toBeNull();
      expect(card.querySelector("[data-meta-bar]")?.className).toContain(
        "color-mix(in_srgb,var(--accent)",
      );
    });

    it("sets the title in a strong 20px face, up to three lines", () => {
      render(<LibraryArticles articles={three} />);
      const title = screen.getAllByRole("heading", { level: 3 })[0];
      expect(title).toHaveClass(
        "font-extrabold",
        "line-clamp-3",
        "leading-[1.25]",
        "xl:text-[1.25rem]",
        "text-[#111]",
      );
    });

    it("sets the summary at 15px in #343434, three lines at most", () => {
      render(<LibraryArticles articles={three} />);
      const summary = screen.getByText("Tóm tắt 1");
      expect(summary).toHaveClass(
        "line-clamp-3",
        "text-[#343434]",
        "sm:text-[0.9375rem]",
        "leading-[1.6]",
      );
    });

    it("keeps room for the title and the summary, so the bars line up", () => {
      render(<LibraryArticles articles={[article(1, { excerpt: null })]} />);
      const [title] = screen.getAllByRole("heading", { level: 3 });
      expect(title).toHaveClass("min-h-[4.25rem]");
      const card = screen.getByRole("article");
      const summary = card.querySelector("p");
      expect(summary).toHaveClass("min-h-[4.5rem]");
      expect(card.querySelector("[data-meta-bar]")).toHaveClass("mt-auto");
    });

    it("draws a small picture at the right of the title, hidden from assistive technology, by topic", () => {
      render(
        <LibraryArticles
          articles={[
            article(1, { tags: [{ name: "Security", slug: "security" }] }),
            article(2, { tags: [{ name: "Backend", slug: "backend" }] }),
            article(3, { tags: [{ name: "Creative", slug: "creative" }] }),
          ]}
        />,
      );
      const kinds = screen
        .getAllByRole("article")
        .map((card) =>
          card
            .querySelector("[data-illustration]")
            ?.getAttribute("data-illustration"),
        );
      expect(kinds).toEqual(["shield", "layers", "ghost"]);
      for (const svg of document.querySelectorAll("[data-illustration]")) {
        expect(svg).toHaveAttribute("aria-hidden", "true");
        expect(svg).toHaveClass(
          "size-[3.25rem]",
          "sm:size-[3.75rem]",
          "xl:size-[4.5rem]",
        );
      }
    });

    it("falls back to the next drawing in turn when no tag has one", () => {
      render(<LibraryArticles articles={three} />);
      const kinds = screen
        .getAllByRole("article")
        .map((card) =>
          card
            .querySelector("[data-illustration]")
            ?.getAttribute("data-illustration"),
        );
      expect(kinds).toEqual(["shield", "layers", "ghost"]);
    });

    it("puts the author, the date and the reading time in one bar that may wrap", () => {
      render(<LibraryArticles articles={[article(1)]} />);
      const bar = document.querySelector("[data-meta-bar]") as HTMLElement;
      expect(bar).toHaveClass("rounded-full", "flex-wrap", "font-semibold");
      expect(within(bar).getByText("AnhHT")).toBeInTheDocument();
      expect(within(bar).getByText("27/10/2026")).toBeInTheDocument();
      expect(within(bar).getByText("4 phút đọc")).toBeInTheDocument();
      // The dividers are only for the eye, and give way when the items wrap.
      for (const divider of within(bar).getAllByText("|")) {
        expect(divider).toHaveAttribute("aria-hidden", "true");
        expect(divider).toHaveClass("max-sm:hidden");
      }
    });

    it("grows smaller on smaller screens: padding, shadow", () => {
      render(<LibraryArticles articles={three} />);
      const card = screen.getAllByRole("article")[0];
      expect(card).toHaveClass("p-[18px]", "sm:p-[22px]", "xl:p-7");
      expect(card.className).toContain("shadow-[5px_5px_0_0_var(--accent)");
      expect(card.className).toContain("sm:shadow-[6px_7px_0_0_var(--accent)");
    });

    it("lifts on hover and keyboard focus, sinks when pressed, and keeps still with reduced motion", () => {
      render(<LibraryArticles articles={three} />);
      const card = screen.getAllByRole("article")[0];
      expect(card).toHaveClass(
        "hover:-translate-x-0.5",
        "hover:-translate-y-[3px]",
      );
      expect(card).toHaveClass("focus-within:-translate-y-[3px]");
      expect(card).toHaveClass(
        "active:translate-x-[5px]",
        "active:translate-y-[5px]",
      );
      expect(card.className).toContain(
        "active:shadow-[2px_2px_0_0_var(--accent)]",
      );
      expect(card).toHaveClass(
        "transition-[transform,box-shadow]",
        "duration-200",
        "motion-reduce:transition-none",
        "motion-reduce:hover:translate-y-0",
      );
    });
  });

  describe("the preview badge", () => {
    it("warns a reader who is not a member that a limited article is cut", () => {
      render(
        <LibraryArticles
          articles={[
            article(1, { visibility: "PREVIEW" }),
            article(2, { visibility: "MEMBERS_ONLY" }),
            article(3),
          ]}
        />,
      );
      expect(screen.getByText("Xem trước")).toBeInTheDocument();
      expect(screen.getByText("Hội viên")).toBeInTheDocument();
      expect(screen.getAllByRole("article")).toHaveLength(3);
    });

    it("is left out for a member, who reads all of it", () => {
      isMember = true;
      render(
        <LibraryArticles articles={[article(1, { visibility: "PREVIEW" })]} />,
      );
      expect(screen.queryByText("Xem trước")).not.toBeInTheDocument();
    });

    it("stays while it is not known yet whether the reader is a member", () => {
      isMember = undefined;
      render(
        <LibraryArticles articles={[article(1, { visibility: "PREVIEW" })]} />,
      );
      expect(screen.getByText("Xem trước")).toBeInTheDocument();
    });

    it("is a strong yellow with a black border, round, with a lock", () => {
      render(
        <LibraryArticles articles={[article(1, { visibility: "PREVIEW" })]} />,
      );
      const badge = screen.getByText("Xem trước").closest("span");
      expect(badge).toHaveClass(
        "bg-[#ffd42a]",
        "border-2",
        "border-[#171717]",
        "font-bold",
      );
      expect(badge?.querySelector("svg")).toHaveAttribute(
        "aria-hidden",
        "true",
      );
    });

    it("is not on a public article", () => {
      render(<LibraryArticles articles={[article(1)]} />);
      expect(screen.queryByText("Xem trước")).not.toBeInTheDocument();
    });
  });

  it("says so when there are none, and when they could not be loaded", () => {
    const { rerender } = render(<LibraryArticles articles={[]} />);
    expect(
      screen.getByText("Chưa có bài viết nào được đăng."),
    ).toBeInTheDocument();
    rerender(<LibraryArticles articles={null} />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Không tải được các bài viết.",
    );
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <LibraryArticles
        articles={[
          article(1, { visibility: "PREVIEW" }),
          article(2),
          article(3),
        ]}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("LibraryArticlesSection", () => {
  beforeEach(() => {
    fetchArticleList.mockReset();
    isMember = false;
  });

  it("asks for the newest three and shows them", async () => {
    fetchArticleList.mockResolvedValue({
      items: [article(1), article(2)],
      nextCursor: null,
    });
    render(await LibraryArticlesSection());
    expect(LIBRARY_ARTICLE_COUNT).toBe(3);
    expect(fetchArticleList).toHaveBeenCalledWith({ limit: "3" });
    expect(
      screen.getByRole("link", { name: "Bài viết số 1" }),
    ).toBeInTheDocument();
  });

  it("turns a failed read into the section's own error, not a thrown error", async () => {
    fetchArticleList.mockRejectedValue(new Error("down"));
    render(await LibraryArticlesSection());
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Không tải được các bài viết.",
    );
  });
});
