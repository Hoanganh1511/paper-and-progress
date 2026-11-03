import { vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import type { ArticleCardData } from "@/features/articles";

expect.extend(toHaveNoViolations);

const refresh = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

import { LatestArticles } from "./LatestArticles";
import { LatestArticlesSkeleton } from "./LatestArticlesSkeleton";

const article = (
  n: number,
  overrides: Partial<ArticleCardData> = {},
): ArticleCardData => ({
  id: `a${n}`,
  slug: `bai-${n}`,
  title: `Bài viết số ${n}`,
  excerpt: null,
  coverImageUrl: `/images/${n}.webp`,
  readingMinutes: 5,
  visibility: "PUBLIC",
  status: "PUBLISHED",
  publishedAt: "2026-10-27T08:00:00.000Z",
  viewCount: 2100,
  seriesOrder: null,
  author: { id: "u1", displayName: "AnhHT" },
  tags: [
    { name: "React", slug: "react" },
    { name: "Hooks", slug: "hooks" },
  ],
  series: null,
  ...overrides,
});

const nine = Array.from({ length: 9 }, (_, i) => article(i + 1));

const titlesShown = () =>
  screen
    .getAllByRole("heading", { level: 3 })
    .map((heading) => heading.textContent);

describe("LatestArticles", () => {
  beforeEach(() => refresh.mockClear());

  it("has a header with the title, the subtitle and a link to every article", () => {
    render(<LatestArticles articles={nine} />);
    expect(
      screen.getByRole("heading", { level: 2, name: "Bài viết mới nhất" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Khám phá những bài viết vừa được đăng trên Baolingo."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Xem tất cả bài viết" }),
    ).not.toBeInTheDocument();
  });

  it("shows the first three articles, each linking to its own slug", () => {
    render(<LatestArticles articles={nine} />);
    expect(titlesShown()).toEqual([
      "Bài viết số 1",
      "Bài viết số 2",
      "Bài viết số 3",
    ]);
    expect(screen.getByRole("link", { name: "Bài viết số 2" })).toHaveAttribute(
      "href",
      "/articles/bai-2",
    );
  });

  it("shows on each card its category, date and views", () => {
    render(<LatestArticles articles={[article(1)]} />);
    expect(screen.getByText("#React")).toBeInTheDocument();
    expect(screen.getByText("27/10/2026")).toBeInTheDocument();
    expect(screen.getByText("2.1k")).toBeInTheDocument();
    expect(screen.getByText("Hooks")).toBeInTheDocument();
  });

  it("hides the views when there are none", () => {
    render(<LatestArticles articles={[article(1, { viewCount: 0 })]} />);
    expect(screen.queryByLabelText(/lượt xem/)).not.toBeInTheDocument();
  });

  it("marks an article that is not for everyone", () => {
    render(
      <LatestArticles
        articles={[article(1, { visibility: "MEMBERS_ONLY" })]}
      />,
    );
    expect(screen.getByText("Hội viên")).toBeInTheDocument();
  });

  it("draws no picture when the article has no thumbnail", () => {
    const { container } = render(
      <LatestArticles articles={[article(1, { coverImageUrl: null })]} />,
    );
    expect(container.querySelector("article img")).toBeNull();
  });

  describe("controls", () => {
    it("moves all three cards to the next group, and the dot follows", async () => {
      render(<LatestArticles articles={nine} />);
      const dots = screen.getAllByRole("button", {
        name: /Nhóm bài viết \d trên 3/,
      });
      expect(dots).toHaveLength(3);
      expect(dots[0]).toHaveAttribute("aria-current", "true");

      await userEvent.click(
        screen.getByRole("button", { name: "Nhóm bài viết tiếp theo" }),
      );
      await waitFor(() =>
        expect(titlesShown()).toEqual([
          "Bài viết số 4",
          "Bài viết số 5",
          "Bài viết số 6",
        ]),
      );
      expect(
        screen.getByRole("button", { name: "Nhóm bài viết 2 trên 3" }),
      ).toHaveAttribute("aria-current", "true");
    });

    it("wraps round from the first group to the last, and from the last to the first", async () => {
      render(<LatestArticles articles={nine} />);
      await userEvent.click(
        screen.getByRole("button", { name: "Nhóm bài viết trước" }),
      );
      await waitFor(() =>
        expect(titlesShown()).toEqual([
          "Bài viết số 7",
          "Bài viết số 8",
          "Bài viết số 9",
        ]),
      );
      await userEvent.click(
        screen.getByRole("button", { name: "Nhóm bài viết tiếp theo" }),
      );
      await waitFor(() =>
        expect(titlesShown()).toEqual([
          "Bài viết số 1",
          "Bài viết số 2",
          "Bài viết số 3",
        ]),
      );
    });

    it("jumps straight to the group of a dot", async () => {
      render(<LatestArticles articles={nine} />);
      await userEvent.click(
        screen.getByRole("button", { name: "Nhóm bài viết 3 trên 3" }),
      );
      await waitFor(() =>
        expect(titlesShown()).toEqual([
          "Bài viết số 7",
          "Bài viết số 8",
          "Bài viết số 9",
        ]),
      );
    });

    it("has no controls, and no empty group, when everything fits in one", () => {
      render(<LatestArticles articles={nine.slice(0, 3)} />);
      expect(
        screen.queryByRole("button", { name: /Nhóm bài viết/ }),
      ).not.toBeInTheDocument();
    });

    it("makes a last group of what is left, with no empty card", async () => {
      render(<LatestArticles articles={nine.slice(0, 4)} />);
      await userEvent.click(
        screen.getByRole("button", { name: "Nhóm bài viết tiếp theo" }),
      );
      await waitFor(() => expect(titlesShown()).toEqual(["Bài viết số 4"]));
    });

    it("lets the keyboard reach the controls and the cards", async () => {
      render(<LatestArticles articles={nine} />);
      await userEvent.tab();
      expect(screen.getByRole("link", { name: "Bài viết số 1" })).toHaveFocus();
    });
  });

  describe("how many cards fit", () => {
    const original = globalThis.ResizeObserver;
    afterEach(() => {
      globalThis.ResizeObserver = original;
    });

    function widthOf(width: number) {
      globalThis.ResizeObserver = class {
        constructor(private callback: ResizeObserverCallback) {}
        observe() {
          this.callback(
            [{ contentRect: { width } } as ResizeObserverEntry],
            this as unknown as ResizeObserver,
          );
        }
        unobserve() {}
        disconnect() {}
      } as unknown as typeof ResizeObserver;
    }

    it("shows one card on a narrow module", async () => {
      widthOf(400);
      render(<LatestArticles articles={nine} />);
      await waitFor(() => expect(titlesShown()).toEqual(["Bài viết số 1"]));
      expect(
        screen.getAllByRole("button", { name: /Nhóm bài viết \d trên 9/ }),
      ).toHaveLength(9);
    });

    it("shows two cards on a medium module", async () => {
      widthOf(700);
      render(<LatestArticles articles={nine} />);
      await waitFor(() =>
        expect(titlesShown()).toEqual(["Bài viết số 1", "Bài viết số 2"]),
      );
    });
  });

  describe("states", () => {
    it("says there is nothing yet, with no controls", () => {
      render(<LatestArticles articles={[]} />);
      expect(
        screen.getByText("Chưa có bài viết mới. Hãy quay lại sau nhé!"),
      ).toBeInTheDocument();
      expect(screen.queryAllByRole("heading", { level: 3 })).toHaveLength(0);
    });

    it("says it could not load, and retries by asking the page again", async () => {
      render(<LatestArticles articles={null} />);
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Không tải được các bài viết mới nhất.",
      );
      await userEvent.click(screen.getByRole("button", { name: "Thử lại" }));
      expect(refresh).toHaveBeenCalledTimes(1);
    });

    it("keeps its header while it loads, and shows three card shapes", () => {
      const { container } = render(<LatestArticlesSkeleton />);
      expect(
        screen.getByRole("heading", { name: "Bài viết mới nhất" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("status")).toHaveTextContent("Đang tải bài viết");
      expect(container.querySelector("[aria-busy='true']")).not.toBeNull();
      expect(
        screen.queryByRole("button", { name: /Nhóm bài viết/ }),
      ).not.toBeInTheDocument();
    });
  });

  it("has no axe violations in any state", async () => {
    const full = render(<LatestArticles articles={nine} />);
    expect(await axe(full.container)).toHaveNoViolations();
    full.unmount();
    const empty = render(<LatestArticles articles={[]} />);
    expect(await axe(empty.container)).toHaveNoViolations();
    empty.unmount();
    const failed = render(<LatestArticles articles={null} />);
    expect(await axe(failed.container)).toHaveNoViolations();
    failed.unmount();
    const loading = render(<LatestArticlesSkeleton />);
    await act(async () => undefined);
    expect(await axe(loading.container)).toHaveNoViolations();
  });
});
