import {
  addDays,
  buildMonthGrid,
  daysInMonth,
  formatLongDate,
  formatMonth,
  formatTime,
  selectionForMonth,
  shiftMonth,
} from "./calendarDate";

describe("buildMonthGrid", () => {
  it("starts on Monday: November 2026 begins on a Sunday, so six rows", () => {
    const grid = buildMonthGrid({ year: 2026, month: 11 });
    expect(grid).toHaveLength(6);
    expect(grid.every((week) => week.length === 7)).toBe(true);
    // 26 Oct to 31 Oct fill the first row, then 1 Nov in the Sunday column
    expect(grid[0].map((cell) => cell.date.slice(5))).toEqual([
      "10-26",
      "10-27",
      "10-28",
      "10-29",
      "10-30",
      "10-31",
      "11-01",
    ]);
    expect(grid[0].map((cell) => cell.isInMonth)).toEqual([
      false,
      false,
      false,
      false,
      false,
      false,
      true,
    ]);
    expect(grid[5][0].date).toBe("2026-11-30");
    expect(grid[5][1].isInMonth).toBe(false);
  });

  it("needs only four rows when February starts on a Monday and has 28 days", () => {
    const grid = buildMonthGrid({ year: 2027, month: 2 });
    expect(grid).toHaveLength(4);
    expect(grid[0][0].date).toBe("2027-02-01");
    expect(grid.flat().every((cell) => cell.isInMonth)).toBe(true);
  });

  it("holds exactly the days of the month as in-month cells", () => {
    for (const [year, month] of [
      [2026, 2],
      [2028, 2],
      [2026, 12],
      [2026, 10],
    ]) {
      const inMonth = buildMonthGrid({ year, month })
        .flat()
        .filter((cell) => cell.isInMonth);
      expect(inMonth).toHaveLength(daysInMonth(year, month));
    }
  });
});

describe("dates as text", () => {
  it("does arithmetic without a time zone moving the day", () => {
    expect(addDays("2026-11-01", -1)).toBe("2026-10-31");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
  });

  it("names the weekday correctly (14 Nov 2026 is a Saturday)", () => {
    expect(formatLongDate("2026-11-14")).toBe("Thứ Bảy, 14 tháng 11, 2026");
    expect(formatLongDate("2026-11-15")).toBe("Chủ Nhật, 15 tháng 11, 2026");
    expect(formatLongDate("2026-11-09")).toBe("Thứ Hai, 9 tháng 11, 2026");
    expect(formatMonth({ year: 2026, month: 11 })).toBe("Tháng 11, 2026");
  });

  it("shifts months across a year boundary", () => {
    expect(shiftMonth({ year: 2026, month: 1 }, -1)).toEqual({
      year: 2025,
      month: 12,
    });
    expect(shiftMonth({ year: 2026, month: 12 }, 1)).toEqual({
      year: 2027,
      month: 1,
    });
    expect(shiftMonth({ year: 2026, month: 11 }, -11)).toEqual({
      year: 2025,
      month: 12,
    });
  });

  it("reads the time as the server wrote it, in Vietnam", () => {
    expect(formatTime("2026-11-14T09:05:00+07:00")).toBe("09:05");
    expect(formatTime(null)).toBeNull();
    expect(formatTime("")).toBeNull();
  });
});

describe("selectionForMonth", () => {
  it("keeps the day number in another month when it exists", () => {
    expect(
      selectionForMonth({ year: 2026, month: 10 }, "2026-11-14", "2026-11-20"),
    ).toBe("2026-10-14");
  });

  it("clamps to the length of a shorter month", () => {
    expect(
      selectionForMonth({ year: 2027, month: 2 }, "2027-01-31", "2027-03-05"),
    ).toBe("2027-02-28");
  });

  it("never lands after today: back in the current month it is today", () => {
    expect(
      selectionForMonth({ year: 2026, month: 11 }, "2026-10-28", "2026-11-14"),
    ).toBe("2026-11-14");
    expect(
      selectionForMonth({ year: 2026, month: 11 }, "2026-10-10", "2026-11-14"),
    ).toBe("2026-11-10");
  });
});
