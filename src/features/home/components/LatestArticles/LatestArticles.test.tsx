import { vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

const refresh = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

import { LatestArticles } from "./LatestArticles";
import { LatestArticlesSkeleton } from "./LatestArticlesSkeleton";
import type { SeriesShowcase } from "./types";

const series = (n: number, stepCount = 3): SeriesShowcase => ({
  id: `s${n}`,
  title: `Series số ${n}`,
  description: `Mô tả series ${n}`,
  sectionCount: 2,
  stepCount,
  steps: [
    {
      id: `${n}a`,
      title: `Bài ${n}.1`,
      href: `/articles/bai-${n}a`,
      minutes: 7,
      isDone: true,
    },
    {
      id: `${n}b`,
      title: `Bài ${n}.2`,
      href: `/articles/bai-${n}b`,
      minutes: 5,
      isDone: false,
    },
    {
      id: `${n}c`,
      title: `Bài ${n}.3`,
      href: `/study-lists/s${n}`,
      minutes: null,
      isDone: false,
    },
  ],
});

const four = [1, 2, 3, 4].map((n) => series(n));

const titlesShown = () =>
  screen
    .getAllByRole("heading", { level: 3 })
    .map((heading) => heading.textContent);

describe("LatestArticles", () => {
  beforeEach(() => refresh.mockClear());

  it("has a header with the title and what the module shows", () => {
    render(<LatestArticles series={four} />);
    expect(
      screen.getByRole("heading", { level: 2, name: "Bài viết mới nhất" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/mỗi series kèm 3 bài đầu tiên/)).toBeVisible();
  });

  it("shows the first three series, each with its name, size and link", () => {
    render(<LatestArticles series={four} />);
    expect(titlesShown()).toEqual([
      "Series số 1",
      "Series số 2",
      "Series số 3",
    ]);
    expect(screen.getByRole("link", { name: "Series số 1" })).toHaveAttribute(
      "href",
      "/study-lists/s1",
    );
    expect(screen.getAllByText("3 bài")).toHaveLength(3);
  });

  it("lists a series' first three lessons in order, with reading time and what is done", () => {
    render(<LatestArticles series={four} />);
    const list = screen.getByRole("list", {
      name: "Các bài của series Series số 1",
    });
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(within(items[0]).getByRole("link")).toHaveTextContent("Bài 1.1");
    expect(within(items[0]).getByRole("link")).toHaveAttribute(
      "href",
      "/articles/bai-1a",
    );
    expect(items[0]).toHaveTextContent("7 phút đọc");
    expect(items[0]).toHaveTextContent("Đã học");
    expect(within(items[2]).getByRole("link")).toHaveAttribute(
      "href",
      "/study-lists/s1",
    );
    expect(items[2]).toHaveTextContent("Bài 1.3");
  });

  describe("controls", () => {
    it("moves to the next group, wraps round, and the dots jump", async () => {
      render(<LatestArticles series={four} />);
      await userEvent.click(
        screen.getByRole("button", { name: "Nhóm series tiếp theo" }),
      );
      await waitFor(() => expect(titlesShown()).toEqual(["Series số 4"]));
      await userEvent.click(
        screen.getByRole("button", { name: "Nhóm series tiếp theo" }),
      );
      await waitFor(() =>
        expect(titlesShown()).toEqual([
          "Series số 1",
          "Series số 2",
          "Series số 3",
        ]),
      );
      await userEvent.click(
        screen.getByRole("button", { name: "Nhóm series 2 trên 2" }),
      );
      await waitFor(() => expect(titlesShown()).toEqual(["Series số 4"]));
    });

    it("has no controls when everything fits in one group", () => {
      render(<LatestArticles series={four.slice(0, 3)} />);
      expect(
        screen.queryByRole("button", { name: /Nhóm series/ }),
      ).not.toBeInTheDocument();
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
      render(<LatestArticles series={four} />);
      await waitFor(() => expect(titlesShown()).toEqual(["Series số 1"]));
    });

    it("shows two cards on a medium module", async () => {
      widthOf(700);
      render(<LatestArticles series={four} />);
      await waitFor(() =>
        expect(titlesShown()).toEqual(["Series số 1", "Series số 2"]),
      );
    });
  });

  describe("states", () => {
    it("shows the given content when there is no series", () => {
      render(
        <LatestArticles series={[]} emptyContent={<p>Đăng nhập nhé</p>} />,
      );
      expect(screen.getByText("Đăng nhập nhé")).toBeInTheDocument();
    });

    it("says there is nothing yet, with no controls", () => {
      render(<LatestArticles series={[]} />);
      expect(
        screen.getByText("Chưa có series nào. Hãy quay lại sau nhé!"),
      ).toBeInTheDocument();
      expect(screen.queryAllByRole("heading", { level: 3 })).toHaveLength(0);
    });

    it("says it could not load, and retries by asking the page again", async () => {
      render(<LatestArticles series={null} />);
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Không tải được các series.",
      );
      await userEvent.click(screen.getByRole("button", { name: "Thử lại" }));
      expect(refresh).toHaveBeenCalledTimes(1);
    });

    it("keeps its header while it loads", () => {
      const { container } = render(<LatestArticlesSkeleton />);
      expect(
        screen.getByRole("heading", { name: "Bài viết mới nhất" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("status")).toHaveTextContent("Đang tải series");
      expect(container.querySelector("[aria-busy='true']")).not.toBeNull();
    });
  });

  it("has no axe violations in any state", async () => {
    const full = render(<LatestArticles series={four} />);
    expect(await axe(full.container)).toHaveNoViolations();
    full.unmount();
    const empty = render(<LatestArticles series={[]} />);
    expect(await axe(empty.container)).toHaveNoViolations();
    empty.unmount();
    const loading = render(<LatestArticlesSkeleton />);
    expect(await axe(loading.container)).toHaveNoViolations();
  });
});
