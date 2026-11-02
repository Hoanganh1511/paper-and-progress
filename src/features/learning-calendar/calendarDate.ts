/**
 * Calendar maths on `YYYY-MM-DD` text. Days are never turned into a local
 * Date: a time zone could move them by a day, and the server already decided
 * which day each thing belongs to.
 */
import type { MonthRef } from "./types";

const WEEKDAY_NAMES = [
  "Chủ Nhật",
  "Thứ Hai",
  "Thứ Ba",
  "Thứ Tư",
  "Thứ Năm",
  "Thứ Sáu",
  "Thứ Bảy",
];

/** Monday first, the order of the grid. */
export const WEEKDAY_HEADERS = [
  { short: "T2", full: "Thứ Hai" },
  { short: "T3", full: "Thứ Ba" },
  { short: "T4", full: "Thứ Tư" },
  { short: "T5", full: "Thứ Năm" },
  { short: "T6", full: "Thứ Sáu" },
  { short: "T7", full: "Thứ Bảy" },
  { short: "CN", full: "Chủ Nhật" },
];

const DAY_MS = 24 * 60 * 60 * 1000;
const pad = (value: number) => String(value).padStart(2, "0");

const toUtc = (key: string) => new Date(`${key}T00:00:00.000Z`);

export const parseKey = (key: string) => ({
  year: Number(key.slice(0, 4)),
  month: Number(key.slice(5, 7)),
  day: Number(key.slice(8, 10)),
});

export const makeKey = (year: number, month: number, day: number) =>
  `${year}-${pad(month)}-${pad(day)}`;

export const addDays = (key: string, days: number) =>
  new Date(toUtc(key).getTime() + days * DAY_MS).toISOString().slice(0, 10);

export const daysInMonth = (year: number, month: number) =>
  new Date(Date.UTC(year, month, 0)).getUTCDate();

export const monthOf = (key: string): MonthRef => {
  const { year, month } = parseKey(key);
  return { year, month };
};

export const sameMonth = (a: MonthRef, b: MonthRef) =>
  a.year === b.year && a.month === b.month;

export const shiftMonth = (ref: MonthRef, delta: number): MonthRef => {
  const index = ref.year * 12 + (ref.month - 1) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
};

/** 0 = Monday ... 6 = Sunday */
const mondayIndex = (key: string) => (toUtc(key).getUTCDay() + 6) % 7;

/** "Thứ Bảy, 14 tháng 11, 2026" */
export function formatLongDate(key: string) {
  const { year, month, day } = parseKey(key);
  return `${WEEKDAY_NAMES[toUtc(key).getUTCDay()]}, ${day} tháng ${month}, ${year}`;
}

/** "Tháng 11, 2026" */
export const formatMonth = ({ year, month }: MonthRef) =>
  `Tháng ${month}, ${year}`;

/** "09:00" from "2026-11-14T09:00:00+07:00" (the time as the server wrote it, in Vietnam). */
export const formatTime = (iso: string | null) =>
  iso && /T\d{2}:\d{2}/.test(iso) ? iso.slice(11, 16) : null;

export interface GridCell {
  date: string;
  /** False for the days of the previous or next month that fill the first and last row. */
  isInMonth: boolean;
}

/** The month as full weeks, Monday first: 5 or 6 rows of 7. */
export function buildMonthGrid({ year, month }: MonthRef): GridCell[][] {
  const first = makeKey(year, month, 1);
  const total = daysInMonth(year, month);
  const lead = mondayIndex(first);
  const cellCount = Math.ceil((lead + total) / 7) * 7;
  const cells: GridCell[] = Array.from({ length: cellCount }, (_, index) => {
    const date = addDays(first, index - lead);
    return { date, isInMonth: sameMonth(monthOf(date), { year, month }) };
  });
  return Array.from({ length: cellCount / 7 }, (_, row) =>
    cells.slice(row * 7, row * 7 + 7),
  );
}

/**
 * Where the selection goes when the month changes: the same day number if the
 * month has it, never after today, and today itself when it is the current month.
 */
export function selectionForMonth(
  target: MonthRef,
  currentSelection: string,
  today: string,
): string {
  const day = Math.min(
    parseKey(currentSelection).day,
    daysInMonth(target.year, target.month),
  );
  const candidate = makeKey(target.year, target.month, day);
  return candidate > today ? today : candidate;
}
