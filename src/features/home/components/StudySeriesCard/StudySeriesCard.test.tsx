import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { vi } from "vitest";
import type { SeriesShowcase } from "@/features/study-lists";

expect.extend(toHaveNoViolations);

const auth = vi.hoisted(() => ({ isAuthenticated: true, isLoading: false }));
vi.mock("@/features/auth", () => ({ useAuth: () => auth }));

const api = vi.hoisted(() => ({ loadSeriesShowcases: vi.fn() }));
vi.mock("@/features/study-lists", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/study-lists")>()),
  ...api,
}));

import { StudySeriesCard } from "./StudySeriesCard";

const series = (overrides: Partial<SeriesShowcase>): SeriesShowcase => ({
  id: "l1",
  title: "React cơ bản",
  description: null,
  sectionCount: 2,
  stepCount: 10,
  doneStepCount: 0,
  steps: [
    {
      id: "t1",
      title: "Bài mở đầu",
      href: "/articles/mo-dau",
      minutes: 5,
      publishedAt: "2026-11-03T08:00:00Z",
      isDone: false,
    },
  ],
  certificates: [],
  ...overrides,
});

beforeEach(() => {
  auth.isAuthenticated = true;
  auth.isLoading = false;
  api.loadSeriesShowcases.mockResolvedValue([
    series({ id: "a", title: "React cơ bản", doneStepCount: 4 }),
    series({ id: "b", title: "SQL cơ bản", doneStepCount: 10 }),
    series({ id: "c", title: "DevOps cho người mới" }),
  ]);
});

describe("StudySeriesCard", () => {
  it("shows the study lists as series cards, with their first lessons, in one box", async () => {
    render(<StudySeriesCard />);
    const card = screen.getByRole("region", { name: "Series học tập" });
    const link = await within(card).findByRole("link", {
      name: "React cơ bản",
    });
    expect(link).toHaveAttribute("href", "/study-lists/a");
    expect(within(card).getAllByText("10 bài")).toHaveLength(3);
    expect(
      within(card).getAllByRole("link", { name: "Bài mở đầu" }),
    ).toHaveLength(3);
    expect(within(card).queryByRole("progressbar")).not.toBeInTheDocument();
    expect(
      within(card).getByRole("link", { name: /Xem tất cả danh sách/ }),
    ).toHaveAttribute("href", "/learn?tab=lists");
  });

  it("filters by where each list is, and says how many are in each group", async () => {
    render(<StudySeriesCard />);
    await screen.findByRole("link", { name: "React cơ bản" });
    expect(
      screen.getByRole("button", { name: /Tất cả \(3\)/ }),
    ).toHaveAttribute("aria-pressed", "true");

    await userEvent.click(
      screen.getByRole("button", { name: /Hoàn thành \(1\)/ }),
    );
    expect(
      screen.getByRole("link", { name: "SQL cơ bản" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "React cơ bản" }),
    ).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: /Chưa bắt đầu \(1\)/ }),
    );
    expect(
      screen.getByRole("link", { name: "DevOps cho người mới" }),
    ).toBeInTheDocument();
  });

  it("invites a visitor who is not signed in, without asking the server", async () => {
    auth.isAuthenticated = false;
    render(<StudySeriesCard />);
    expect(
      await screen.findByRole("link", { name: "Đăng nhập" }),
    ).toHaveAttribute("href", "/login");
    expect(api.loadSeriesShowcases).not.toHaveBeenCalled();
  });

  it("says so when there are no lists yet", async () => {
    api.loadSeriesShowcases.mockResolvedValue([]);
    render(<StudySeriesCard />);
    expect(
      await screen.findByText(/Chưa có danh sách học nào/),
    ).toBeInTheDocument();
  });

  it("shows the error with a way to retry", async () => {
    api.loadSeriesShowcases.mockRejectedValue(new Error("Máy chủ bận"));
    render(<StudySeriesCard />);
    expect(await screen.findByText("Máy chủ bận")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<StudySeriesCard />);
    await screen.findByRole("link", { name: "React cơ bản" });
    expect(await axe(container)).toHaveNoViolations();
  });
});
