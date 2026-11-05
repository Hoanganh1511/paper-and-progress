import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { vi } from "vitest";
import type { StudyListSummary } from "@/features/study-lists";

expect.extend(toHaveNoViolations);

const auth = vi.hoisted(() => ({ isAuthenticated: true, isLoading: false }));
vi.mock("@/features/auth", () => ({ useAuth: () => auth }));

const api = vi.hoisted(() => ({ listStudyLists: vi.fn() }));
vi.mock("@/features/study-lists", () => api);

import { StudySeriesCard } from "./StudySeriesCard";

const list = (overrides: Partial<StudyListSummary>): StudyListSummary => ({
  id: "l1",
  title: "React cơ bản",
  description: null,
  sectionCount: 2,
  stepCount: 10,
  doneStepCount: 0,
  progress: 0,
  certificates: [],
  ...overrides,
});

beforeEach(() => {
  auth.isAuthenticated = true;
  auth.isLoading = false;
  api.listStudyLists.mockResolvedValue([
    list({ id: "a", title: "React cơ bản", doneStepCount: 4, progress: 40 }),
    list({ id: "b", title: "SQL cơ bản", doneStepCount: 10, progress: 100 }),
    list({ id: "c", title: "DevOps cho người mới" }),
  ]);
});

describe("StudySeriesCard", () => {
  it("shows the study lists as links with their chapter and lesson counts only, in one box", async () => {
    render(<StudySeriesCard />);
    const card = screen.getByRole("region", { name: "Series học tập" });
    const link = await within(card).findByRole("link", {
      name: "React cơ bản",
    });
    expect(link).toHaveAttribute("href", "/study-lists/a");
    expect(within(card).getAllByText("2 chương")).toHaveLength(3);
    expect(within(card).getAllByText("10 bài")).toHaveLength(3);
    expect(within(card).queryByRole("progressbar")).not.toBeInTheDocument();
    expect(within(card).queryByText(/đã học/)).not.toBeInTheDocument();
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
    expect(api.listStudyLists).not.toHaveBeenCalled();
  });

  it("says so when there are no lists yet", async () => {
    api.listStudyLists.mockResolvedValue([]);
    render(<StudySeriesCard />);
    expect(
      await screen.findByText(/Chưa có danh sách học nào/),
    ).toBeInTheDocument();
  });

  it("shows the error with a way to retry", async () => {
    api.listStudyLists.mockRejectedValue(new Error("Máy chủ bận"));
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
