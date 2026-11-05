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
  doneStepCount: 0,
  certificates: [],
  steps: [
    {
      id: `${n}a`,
      title: `Bài ${n}.1`,
      href: `/articles/bai-${n}a`,
      minutes: 7,
      publishedAt: "2026-11-03T08:00:00Z",
      isDone: true,
    },
    {
      id: `${n}b`,
      title: `Bài ${n}.2`,
      href: `/articles/bai-${n}b`,
      minutes: 5,
      publishedAt: "2026-11-04T08:00:00Z",
      isDone: false,
    },
    {
      id: `${n}c`,
      title: `Bài ${n}.3`,
      href: `/study-lists/s${n}`,
      minutes: null,
      publishedAt: null,
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
      screen.getByRole("heading", { level: 2, name: "Hoạt động gần đây" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Khám phá các series mới nhất"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Vuốt để khám phá/)).not.toBeInTheDocument();
  });

  it("puts the newest series in front, whole, and the next ones behind it", () => {
    render(<LatestArticles series={four} />);
    expect(titlesShown()).toEqual([
      "Series số 1",
      "Series số 2",
      "Series số 3",
      "Series số 4",
    ]);
    expect(screen.getByRole("link", { name: "Series số 1" })).toHaveAttribute(
      "href",
      "/study-lists/s1",
    );
    // the front card has its lessons with date and reading time; the others only titles
    const front = screen.getByRole("list", {
      name: "Các bài của series Series số 1",
    });
    expect(front).toHaveTextContent("7 phút đọc");
    expect(front).toHaveTextContent("03/11/2026");
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

  it("makes the cards behind inert and chooses them as a whole", () => {
    render(<LatestArticles series={four} />);
    const behind = screen.getByRole("button", {
      name: "Xem series Series số 2",
    });
    expect(behind.parentElement?.querySelector("[inert]")).not.toBeNull();
    // the front card is not inert and has no "bring me forward" button
    expect(
      screen.queryByRole("button", { name: "Xem series Series số 1" }),
    ).not.toBeInTheDocument();
  });

  describe("controls", () => {
    const frontTitle = () =>
      screen
        .getByRole("status", { hidden: false })
        .textContent?.replace(/^Series \d+ trên \d+: /, "");

    it("moves to the next series and the previous one, and wraps round", async () => {
      render(<LatestArticles series={four} />);
      expect(frontTitle()).toBe("Series số 1");
      await userEvent.click(
        screen.getByRole("button", { name: "Nhóm series tiếp theo" }),
      );
      expect(frontTitle()).toBe("Series số 2");
      await userEvent.click(
        screen.getByRole("button", { name: "Nhóm series trước" }),
      );
      await userEvent.click(
        screen.getByRole("button", { name: "Nhóm series trước" }),
      );
      expect(frontTitle()).toBe("Series số 4");
    });

    it("jumps with the dots and with a click on a card behind", async () => {
      render(<LatestArticles series={four} />);
      await userEvent.click(
        screen.getByRole("button", { name: "Nhóm series 3 trên 4" }),
      );
      expect(frontTitle()).toBe("Series số 3");
      await userEvent.click(
        screen.getByRole("button", { name: "Xem series Series số 4" }),
      );
      expect(frontTitle()).toBe("Series số 4");
    });

    it("moves with the arrow keys", async () => {
      render(<LatestArticles series={four} />);
      screen.getByRole("button", { name: "Nhóm series tiếp theo" }).focus();
      await userEvent.keyboard("{ArrowRight}");
      expect(frontTitle()).toBe("Series số 2");
      await userEvent.keyboard("{ArrowLeft}{ArrowLeft}");
      expect(frontTitle()).toBe("Series số 4");
    });

    it("has no controls when there is only one series", () => {
      render(<LatestArticles series={four.slice(0, 1)} />);
      expect(
        screen.queryByRole("button", { name: /Nhóm series/ }),
      ).not.toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Series số 1" })).toBeVisible();
    });

    it("works with two and three series", async () => {
      render(<LatestArticles series={four.slice(0, 2)} />);
      await userEvent.click(
        screen.getByRole("button", { name: "Nhóm series tiếp theo" }),
      );
      expect(frontTitle()).toBe("Series số 2");
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

    const reachable = () =>
      screen.queryAllByRole("button", { name: /^Xem series / });

    it("stands the front card and two on each side on a wide stage", () => {
      widthOf(1100);
      render(
        <LatestArticles series={[1, 2, 3, 4, 5, 6].map((n) => series(n))} />,
      );
      expect(reachable()).toHaveLength(4);
    });

    it("stands one on each side on a medium stage", async () => {
      widthOf(800);
      render(
        <LatestArticles series={[1, 2, 3, 4, 5, 6].map((n) => series(n))} />,
      );
      await waitFor(() => expect(reachable()).toHaveLength(2));
    });

    it("shows only the front card on a narrow stage; the others come with a swipe or the controls", async () => {
      widthOf(400);
      render(<LatestArticles series={four} />);
      await waitFor(() => expect(reachable()).toHaveLength(0));
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
        screen.getByRole("heading", { name: "Hoạt động gần đây" }),
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
