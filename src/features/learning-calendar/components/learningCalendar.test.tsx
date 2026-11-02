import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { vi } from "vitest";
import { buildMonthGrid } from "../calendarDate";
import type {
  CalendarDay,
  CalendarResponse,
  DayActivity,
  DayResponse,
  Intensity,
} from "../types";

expect.extend(toHaveNoViolations);

const api = vi.hoisted(() => ({
  getCalendar: vi.fn(),
  getDayActivity: vi.fn(),
}));
vi.mock("../learningCalendarApi", () => api);

import { DailyActivityPanel } from "./DailyActivityPanel";
import { LearningCalendarSection } from "./LearningCalendarSection";
import { LearningOverview } from "./LearningOverview";
import { MonthlyCalendar } from "./MonthlyCalendar";

const TODAY = "2026-11-14";

function monthDays(
  year: number,
  month: number,
  active: Record<string, number> = {},
) {
  const total = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return Array.from({ length: total }, (_, index): CalendarDay => {
    const date = `${year}-${String(month).padStart(2, "0")}-${String(index + 1).padStart(2, "0")}`;
    const count = date > TODAY ? 0 : (active[date] ?? 0);
    return {
      date,
      hasActivity: count > 0,
      activityCount: count,
      intensity: Math.min(count, 4) as Intensity,
    };
  });
}

const calendar = (
  year: number,
  month: number,
  active: Record<string, number>,
  summary: Partial<CalendarResponse["summary"]> = {},
): CalendarResponse => {
  const days = monthDays(year, month, active);
  return {
    today: TODAY,
    goal: { language: "English", level: "B2", label: "B2 English" },
    month: {
      year,
      month,
      timezone: "Asia/Ho_Chi_Minh",
      daysInMonth: days.length,
    },
    summary: {
      learningDaysInMonth: days.filter((day) => day.hasActivity).length,
      learningDaysTotal: 20,
      currentStreak: 5,
      longestStreak: 21,
      ...summary,
    },
    days,
  };
};

const activity = (
  type: DayActivity["type"],
  overrides: Partial<DayActivity> = {},
): DayActivity => ({
  id: `x:${type}`,
  type,
  title: `Title ${type}`,
  description: `About ${type}`,
  status: "COMPLETED",
  occurredAt: null,
  targetUrl: null,
  ...overrides,
});

const dayWith = (date: string, activities: DayActivity[]): DayResponse => ({
  date,
  hasActivity: activities.length > 0,
  summary: { activityCount: activities.length, durationMinutes: null },
  activities,
});

beforeEach(() => vi.clearAllMocks());

describe("MonthlyCalendar", () => {
  const props = (overrides = {}) => ({
    month: { year: 2026, month: 11 },
    days: monthDays(2026, 11, {
      "2026-11-02": 1,
      "2026-11-10": 3,
      "2026-11-14": 4,
    }),
    isLoading: false,
    today: TODAY,
    selected: "2026-11-10",
    canGoNext: false,
    onSelect: vi.fn(),
    onPreviousMonth: vi.fn(),
    onNextMonth: vi.fn(),
    onToday: vi.fn(),
    ...overrides,
  });

  it("shows the month Monday first, every day with a name that says date and activity", async () => {
    const { container } = render(<MonthlyCalendar {...props()} />);
    expect(
      screen.getByRole("heading", { name: "Tháng 11, 2026" }),
    ).toBeInTheDocument();
    const headers = screen
      .getAllByRole("columnheader")
      .map((h) => h.querySelector(".sr-only")?.textContent);
    expect(headers).toEqual([
      "Thứ Hai",
      "Thứ Ba",
      "Thứ Tư",
      "Thứ Năm",
      "Thứ Sáu",
      "Thứ Bảy",
      "Chủ Nhật",
    ]);
    expect(
      screen.getByRole("button", {
        name: "Thứ Ba, 10 tháng 11, 2026, 3 hoạt động, hoạt động nhiều",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Thứ Ba, 3 tháng 11, 2026, chưa có hoạt động",
      }),
    ).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("marks today without relying on colour, and the selected day as selected", () => {
    render(<MonthlyCalendar {...props()} />);
    const today = screen.getByRole("button", {
      name: /Thứ Bảy, 14 tháng 11, 2026.*hôm nay/,
    });
    expect(today).toHaveAttribute("aria-current", "date");
    expect(
      screen
        .getByRole("button", { name: /^Thứ Ba, 10 tháng 11/ })
        .closest("[role=gridcell]"),
    ).toHaveAttribute("aria-selected", "true");
  });

  it("does not let a day after today, or a day of another month, be picked", async () => {
    const onSelect = vi.fn();
    render(<MonthlyCalendar {...props({ onSelect })} />);
    const future = screen.getByRole("button", {
      name: /^Chủ Nhật, 15 tháng 11/,
    });
    expect(future).toBeDisabled();
    await userEvent.click(future);
    // 26 Oct fills the first row
    expect(
      screen.getByRole("button", { name: /^Thứ Hai, 26 tháng 10/ }),
    ).toBeDisabled();
    expect(onSelect).not.toHaveBeenCalled();
    await userEvent.click(
      screen.getByRole("button", { name: /^Thứ Hai, 2 tháng 11/ }),
    );
    expect(onSelect).toHaveBeenCalledWith("2026-11-02");
  });

  it("moves focus with the arrow keys and stops at the edge of what can be picked", async () => {
    render(<MonthlyCalendar {...props({ selected: "2026-11-14" })} />);
    const day = (n: number) =>
      screen.getByRole("button", { name: new RegExp(`, ${n} tháng 11`) });
    day(14).focus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(day(13)).toHaveFocus();
    await userEvent.keyboard("{ArrowUp}");
    expect(day(6)).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    expect(day(7)).toHaveFocus();
    day(14).focus();
    await userEvent.keyboard("{ArrowRight}"); // 15 Nov is in the future
    expect(day(14)).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}");
    expect(day(14)).toHaveFocus();
  });

  it("picks the focused day with Enter and with Space", async () => {
    const onSelect = vi.fn();
    render(<MonthlyCalendar {...props({ onSelect })} />);
    screen.getByRole("button", { name: /, 5 tháng 11/ }).focus();
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard(" ");
    expect(onSelect).toHaveBeenCalledTimes(2);
    expect(onSelect).toHaveBeenCalledWith("2026-11-05");
  });

  it("has one tab stop: the selected day", () => {
    render(<MonthlyCalendar {...props()} />);
    const stops = screen
      .getAllByRole("button")
      .filter(
        (button) =>
          button.getAttribute("tabindex") === "0" &&
          button.closest("[role=grid]"),
      );
    expect(stops).toHaveLength(1);
    expect(stops[0]).toHaveAccessibleName(/10 tháng 11/);
  });

  it("offers last month, and next month only when allowed", async () => {
    const onPreviousMonth = vi.fn();
    const onNextMonth = vi.fn();
    const { rerender } = render(
      <MonthlyCalendar {...props({ onPreviousMonth, onNextMonth })} />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Tháng trước" }));
    expect(onPreviousMonth).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Tháng sau" })).toBeDisabled();
    rerender(
      <MonthlyCalendar
        {...props({ onPreviousMonth, onNextMonth, canGoNext: true })}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Tháng sau" }));
    expect(onNextMonth).toHaveBeenCalled();
  });

  it("gives every day a touch target of at least 44px", () => {
    render(<MonthlyCalendar {...props()} />);
    const cell = screen.getByRole("button", { name: /, 5 tháng 11/ });
    expect(cell).toHaveClass("min-h-11");
  });

  it("has a legend in words, not only swatches", () => {
    render(<MonthlyCalendar {...props()} />);
    const legend = screen.getByRole("group", {
      name: "Chú giải mức hoạt động",
    });
    expect(within(legend).getByText("Ít")).toBeInTheDocument();
    expect(within(legend).getByText("Nhiều")).toBeInTheDocument();
  });

  it("builds the same cells as the grid utility", () => {
    render(<MonthlyCalendar {...props()} />);
    const cells = screen.getAllByRole("gridcell");
    expect(cells).toHaveLength(
      buildMonthGrid({ year: 2026, month: 11 }).flat().length,
    );
  });
});

describe("LearningOverview", () => {
  it("shows the three numbers with the scope in the label, and the month ratio", () => {
    render(
      <LearningOverview
        data={calendar(2026, 11, { "2026-11-02": 1, "2026-11-03": 2 })}
        monthNumber={11}
      />,
    );
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("Ngày streak hiện tại")).toBeInTheDocument();
    expect(screen.getByText("21")).toBeInTheDocument();
    expect(screen.getByText("Streak dài nhất")).toBeInTheDocument();
    expect(screen.getByText("Ngày học trong tháng 11")).toBeInTheDocument();
    expect(screen.getByText("2 / 30 ngày")).toBeInTheDocument();
    expect(
      screen.getByRole("progressbar", { name: /2 trên 30 ngày/ }),
    ).toBeInTheDocument();
  });

  it("shows no numbers while the month loads", () => {
    render(<LearningOverview data={null} monthNumber={11} />);
    expect(screen.queryByText("Ngày streak hiện tại")).not.toBeInTheDocument();
  });
});

describe("DailyActivityPanel", () => {
  const panel = (overrides = {}) => ({
    date: "2026-11-14",
    today: TODAY,
    data: null as DayResponse | null,
    isLoading: false,
    error: undefined as Error | undefined,
    onRetry: vi.fn(),
    onPreviousDay: vi.fn(),
    onNextDay: vi.fn(),
    onToday: vi.fn(),
    ...overrides,
  });

  it("lists the day's activities with the real count and no made-up study time", async () => {
    const { container } = render(
      <DailyActivityPanel
        {...panel({
          data: dayWith("2026-11-14", [
            activity("DAILY_LESSON", {
              occurredAt: "2026-11-14T09:00:00+07:00",
            }),
            activity("PHRASE_WRITE"),
          ]),
        })}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Thứ Bảy, 14 tháng 11, 2026" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Có hoạt động")).toBeInTheDocument();
    expect(screen.getByText("2 hoạt động")).toBeInTheDocument();
    expect(screen.getByText(/About DAILY_LESSON · 09:00/)).toBeInTheDocument();
    expect(screen.getAllByText("Hoàn thành")).toHaveLength(2);
    expect(screen.queryByText(/phút/)).not.toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("an activity is read-only unless its module gave it a link", () => {
    render(
      <DailyActivityPanel
        {...panel({
          data: dayWith("2026-11-14", [
            activity("DAILY_LESSON"),
            activity("PHRASE_WRITE", { targetUrl: "/somewhere" }),
          ]),
        })}
      />,
    );
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("href", "/somewhere");
  });

  it("an empty day today invites the user to start, and says nothing was recorded", () => {
    render(
      <DailyActivityPanel {...panel({ data: dayWith("2026-11-14", []) })} />,
    );
    expect(screen.getByText("Chưa có hoạt động")).toBeInTheDocument();
    expect(screen.getByText("Hôm nay bạn chưa học gì.")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Bắt đầu học ngay" }),
    ).toHaveAttribute("href", "/learn");
    expect(screen.queryByText(/^\d+ hoạt động$/)).not.toBeInTheDocument();
  });

  it("an empty day in the past is worded for the past", () => {
    render(
      <DailyActivityPanel
        {...panel({ date: "2026-11-10", data: dayWith("2026-11-10", []) })}
      />,
    );
    expect(screen.getByText("Ngày này bạn chưa học gì.")).toBeInTheDocument();
  });

  it("offers no way to start learning for a day that has not come", () => {
    render(
      <DailyActivityPanel
        {...panel({ date: "2026-11-20", data: dayWith("2026-11-20", []) })}
      />,
    );
    expect(
      screen.queryByRole("link", { name: "Bắt đầu học ngay" }),
    ).not.toBeInTheDocument();
  });

  it("shows an error with a retry, and keeps the day controls", async () => {
    const onRetry = vi.fn();
    render(
      <DailyActivityPanel {...panel({ error: new Error("x"), onRetry })} />,
    );
    expect(
      screen.getByText("Không thể tải hoạt động của ngày này"),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(onRetry).toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Ngày trước" }),
    ).toBeInTheDocument();
  });

  it("shows neither a list nor a status while loading", () => {
    render(<DailyActivityPanel {...panel({ isLoading: true })} />);
    expect(screen.queryByText("Có hoạt động")).not.toBeInTheDocument();
    expect(screen.queryByText("Chưa có hoạt động")).not.toBeInTheDocument();
  });

  it("steps through days, and cannot go past today", async () => {
    const onPreviousDay = vi.fn();
    const onNextDay = vi.fn();
    const onToday = vi.fn();
    const { rerender } = render(
      <DailyActivityPanel
        {...panel({
          data: dayWith("2026-11-14", []),
          onPreviousDay,
          onNextDay,
          onToday,
        })}
      />,
    );
    expect(screen.getByRole("button", { name: "Ngày sau" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Ngày trước" }));
    await userEvent.click(screen.getByRole("button", { name: "Về hôm nay" }));
    expect(onPreviousDay).toHaveBeenCalled();
    expect(onToday).toHaveBeenCalled();
    rerender(
      <DailyActivityPanel
        {...panel({
          date: "2026-11-10",
          data: dayWith("2026-11-10", []),
          onNextDay,
        })}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Ngày sau" }));
    expect(onNextDay).toHaveBeenCalled();
  });
});

describe("LearningCalendarSection", () => {
  const nov = calendar(2026, 11, { "2026-11-10": 2, "2026-11-14": 3 });
  const oct = calendar(2026, 10, { "2026-10-14": 1 }, { currentStreak: 5 });

  beforeEach(() => {
    api.getCalendar.mockImplementation(
      async (month?: { year: number; month: number }) =>
        month?.month === 10 ? oct : nov,
    );
    api.getDayActivity.mockImplementation(async (date: string) =>
      dayWith(date, date === "2026-11-14" ? [activity("DAILY_LESSON")] : []),
    );
  });

  it("opens on today: the server's month, today selected, today's list", async () => {
    const { container } = render(<LearningCalendarSection />);
    expect(
      await screen.findByRole("heading", {
        name: "Thứ Bảy, 14 tháng 11, 2026",
      }),
    ).toBeInTheDocument();
    expect(api.getCalendar).toHaveBeenCalledWith(undefined);
    expect(api.getDayActivity).toHaveBeenCalledWith("2026-11-14");
    expect(await screen.findByText("Title DAILY_LESSON")).toBeInTheDocument();
    // The box is the page: it has the page's one h1, then what is being tracked.
    expect(
      screen.getByRole("heading", { level: 1, name: "Mục tiêu học tiếng Anh" }),
    ).toBeInTheDocument();
    // The goal sits beside the title as plain text: no chips, cards or badges.
    expect(screen.getByText("Mục tiêu B2")).toBeInTheDocument();
    expect(screen.queryByText("Đang theo dõi")).not.toBeInTheDocument();
    expect(screen.queryByText("B2 Destination")).not.toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("picking a day loads that day without reloading the month", async () => {
    render(<LearningCalendarSection />);
    await screen.findByText("Title DAILY_LESSON");
    await userEvent.click(
      screen.getByRole("button", { name: /^Thứ Ba, 10 tháng 11/ }),
    );
    await waitFor(() =>
      expect(api.getDayActivity).toHaveBeenCalledWith("2026-11-10"),
    );
    expect(
      await screen.findByRole("heading", { name: "Thứ Ba, 10 tháng 11, 2026" }),
    ).toBeInTheDocument();
    expect(api.getCalendar).toHaveBeenCalledTimes(1);
  });

  it("changing month asks for that month and moves the selection into it", async () => {
    render(<LearningCalendarSection />);
    await screen.findByText("Title DAILY_LESSON");
    await userEvent.click(screen.getByRole("button", { name: "Tháng trước" }));
    await waitFor(() =>
      expect(api.getCalendar).toHaveBeenLastCalledWith({
        year: 2026,
        month: 10,
      }),
    );
    expect(
      await screen.findByRole("heading", { name: "Tháng 10, 2026" }),
    ).toBeInTheDocument();
    // same day number, in October
    expect(
      await screen.findByRole("heading", { name: "Thứ Tư, 14 tháng 10, 2026" }),
    ).toBeInTheDocument();
    expect(api.getDayActivity).toHaveBeenCalledWith("2026-10-14");
  });

  it("never shows November's numbers under October's title while October loads", async () => {
    let finish!: (value: CalendarResponse) => void;
    api.getCalendar.mockImplementation(
      (month?: { year: number; month: number }) =>
        month?.month === 10
          ? new Promise<CalendarResponse>((resolve) => (finish = resolve))
          : Promise.resolve(nov),
    );
    render(<LearningCalendarSection />);
    await screen.findByText("Title DAILY_LESSON");
    expect(screen.getByText("2 / 30 ngày")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Tháng trước" }));
    expect(
      await screen.findByRole("heading", { name: "Tháng 10, 2026" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("2 / 30 ngày")).not.toBeInTheDocument();
    expect(screen.getByRole("grid")).toHaveAttribute("aria-busy", "true");
    finish(oct);
    expect(await screen.findByText("1 / 31 ngày")).toBeInTheDocument();
  });

  it("the Today button returns to the current month and day", async () => {
    render(<LearningCalendarSection />);
    await screen.findByText("Title DAILY_LESSON");
    await userEvent.click(screen.getByRole("button", { name: "Tháng trước" }));
    await screen.findByRole("heading", { name: "Tháng 10, 2026" });
    await userEvent.click(
      screen.getAllByRole("button", { name: "Hôm nay" })[0],
    );
    expect(
      await screen.findByRole("heading", { name: "Tháng 11, 2026" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", {
        name: "Thứ Bảy, 14 tháng 11, 2026",
      }),
    ).toBeInTheDocument();
  });

  it("stepping a day back over a month edge brings the calendar along", async () => {
    const first = calendar(2026, 11, { "2026-11-01": 1 });
    api.getCalendar.mockImplementation(
      async (month?: { year: number; month: number }) =>
        month?.month === 10 ? oct : first,
    );
    render(<LearningCalendarSection />);
    await screen.findByRole("heading", { name: "Thứ Bảy, 14 tháng 11, 2026" });
    await userEvent.click(
      screen.getByRole("button", { name: /^Chủ Nhật, 1 tháng 11/ }),
    );
    await screen.findByRole("heading", { name: "Chủ Nhật, 1 tháng 11, 2026" });
    await userEvent.click(screen.getByRole("button", { name: "Ngày trước" }));
    expect(
      await screen.findByRole("heading", {
        name: "Thứ Bảy, 31 tháng 10, 2026",
      }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: "Tháng 10, 2026" }),
    ).toBeInTheDocument();
  });

  it("a failed calendar shows one error with a retry that works", async () => {
    api.getCalendar.mockRejectedValueOnce(new Error("down"));
    render(<LearningCalendarSection />);
    expect(
      await screen.findByText("Không thể tải dữ liệu học tập"),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(
      await screen.findByRole("heading", {
        name: "Thứ Bảy, 14 tháng 11, 2026",
      }),
    ).toBeInTheDocument();
  });

  it("a failed day keeps the calendar and retries only that day", async () => {
    api.getDayActivity.mockRejectedValueOnce(new Error("down"));
    render(<LearningCalendarSection />);
    expect(
      await screen.findByText("Không thể tải hoạt động của ngày này"),
    ).toBeInTheDocument();
    expect(screen.getByRole("grid")).toBeInTheDocument();
    const calendarCalls = api.getCalendar.mock.calls.length;
    await userEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(await screen.findByText("Title DAILY_LESSON")).toBeInTheDocument();
    expect(api.getCalendar).toHaveBeenCalledTimes(calendarCalls);
  });

  it("does not offer next month while the current month is shown", async () => {
    render(<LearningCalendarSection />);
    await screen.findByText("Title DAILY_LESSON");
    expect(screen.getByRole("button", { name: "Tháng sau" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Tháng trước" }));
    await screen.findByRole("heading", { name: "Tháng 10, 2026" });
    expect(screen.getByRole("button", { name: "Tháng sau" })).toBeEnabled();
  });
});
