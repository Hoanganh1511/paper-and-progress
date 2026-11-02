"use client";

import { useRef, type KeyboardEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button, IconButton, Text, cn } from "@/design-system";
import {
  WEEKDAY_HEADERS,
  addDays,
  buildMonthGrid,
  formatLongDate,
  formatMonth,
  sameMonth,
  monthOf,
} from "../calendarDate";
import type { CalendarDay, Intensity, MonthRef } from "../types";

const LEVEL_CLASSES: Record<Intensity, string> = {
  0: "bg-surface-sunken text-text-secondary",
  1: "bg-activity-1 text-ink",
  2: "bg-activity-2 text-ink",
  3: "bg-activity-3 text-ink",
  4: "bg-activity-4 text-ink",
};

const LEVEL_NAMES: Record<Intensity, string> = {
  0: "chưa có hoạt động",
  1: "hoạt động ít",
  2: "hoạt động vừa",
  3: "hoạt động nhiều",
  4: "hoạt động rất nhiều",
};

export interface MonthlyCalendarProps {
  month: MonthRef;
  /** The month's days from the server; empty while they load. */
  days: CalendarDay[];
  isLoading: boolean;
  today: string;
  selected: string;
  /** Next month is not offered while the shown month is the current one. */
  canGoNext: boolean;
  onSelect: (date: string) => void;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}

/** What a screen reader hears for a day: the date, how much was done, and whether it is today. */
function cellLabel(
  date: string,
  day: CalendarDay | undefined,
  isToday: boolean,
) {
  const what = day?.hasActivity
    ? `${day.activityCount} hoạt động, ${LEVEL_NAMES[day.intensity]}`
    : "chưa có hoạt động";
  return `${formatLongDate(date)}, ${what}${isToday ? ", hôm nay" : ""}`;
}

/**
 * The month as a grid of days, Monday first. The colour says how much a day has
 * in it; the label says the same in words. Arrow keys move between days, Enter
 * or Space picks one. Days after today cannot be picked.
 */
export function MonthlyCalendar({
  month,
  days,
  isLoading,
  today,
  selected,
  canGoNext,
  onSelect,
  onPreviousMonth,
  onNextMonth,
  onToday,
}: MonthlyCalendarProps) {
  const refs = useRef(new Map<string, HTMLButtonElement>());
  const byDate = new Map(days.map((day) => [day.date, day]));
  const grid = buildMonthGrid(month);

  const isPickable = (date: string, isInMonth: boolean) =>
    isInMonth && date <= today;
  // One tab stop for the whole grid: the selected day, or the first pickable one.
  const tabStop = sameMonth(monthOf(selected), month)
    ? selected
    : (grid.flat().find((cell) => isPickable(cell.date, cell.isInMonth))
        ?.date ?? "");

  function move(from: string, delta: number) {
    const target = addDays(from, delta);
    const cell = grid.flat().find((item) => item.date === target);
    if (cell && isPickable(cell.date, cell.isInMonth)) {
      refs.current.get(target)?.focus();
    }
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    date: string,
  ) {
    const steps: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
    };
    if (event.key in steps) {
      event.preventDefault();
      move(date, steps[event.key]);
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-3 max-sm:-mx-1">
      <div className="flex items-center justify-between gap-2">
        <IconButton
          icon={ChevronLeft}
          variant="outline"
          size="compact"
          aria-label="Tháng trước"
          onClick={onPreviousMonth}
        />
        <Text
          as="h2"
          size="body-lg"
          weight="bold"
          className="font-display"
          aria-live="polite"
        >
          {formatMonth(month)}
        </Text>
        <IconButton
          icon={ChevronRight}
          variant="outline"
          size="compact"
          aria-label="Tháng sau"
          disabled={!canGoNext}
          onClick={onNextMonth}
        />
      </div>

      <div
        role="grid"
        aria-label={`Lịch học ${formatMonth(month)}`}
        aria-busy={isLoading}
        className={cn("flex flex-col", isLoading && "opacity-60")}
      >
        <div role="row" className="grid grid-cols-7">
          {WEEKDAY_HEADERS.map((weekday) => (
            <div
              key={weekday.short}
              role="columnheader"
              className="m-0.5 flex min-h-7 items-center justify-center rounded-sharp bg-surface-sunken text-caption font-semibold"
            >
              <span aria-hidden="true">{weekday.short}</span>
              <span className="sr-only">{weekday.full}</span>
            </div>
          ))}
        </div>
        {grid.map((week) => (
          <div key={week[0].date} role="row" className="grid grid-cols-7">
            {week.map(({ date, isInMonth }) => {
              const day = byDate.get(date);
              const isToday = date === today;
              const isSelected = date === selected;
              const level = (isInMonth && day ? day.intensity : 0) as Intensity;
              const isPickableDay = isPickable(date, isInMonth);
              return (
                <div key={date} role="gridcell" aria-selected={isSelected}>
                  <button
                    ref={(element) => {
                      if (element) refs.current.set(date, element);
                      else refs.current.delete(date);
                    }}
                    type="button"
                    disabled={!isPickableDay}
                    tabIndex={date === tabStop ? 0 : -1}
                    aria-label={cellLabel(date, day, isToday)}
                    aria-current={isToday ? "date" : undefined}
                    title={cellLabel(date, day, isToday)}
                    onClick={() => onSelect(date)}
                    onKeyDown={(event) => handleKeyDown(event, date)}
                    // The button is the whole touch target (at least 44px); the coloured cell sits inside it.
                    className={cn(
                      "group relative flex aspect-square min-h-11 w-full items-center justify-center rounded-standard lg:aspect-auto lg:h-11",
                      "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-solid focus-visible:outline-border-focus",
                      isPickableDay ? "cursor-pointer" : "cursor-default",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "pointer-events-none absolute inset-0.5 flex items-center justify-center rounded-standard border-2 border-transparent text-body-sm font-semibold transition-colors motion-reduce:transition-none",
                        LEVEL_CLASSES[level],
                        isPickableDay
                          ? "group-hover:border-border-strong"
                          : "bg-transparent text-text-muted opacity-60",
                        isSelected &&
                          "border-border-strong bg-accent-lime text-ink shadow-raised",
                      )}
                    >
                      {Number(date.slice(8, 10))}
                      {isToday && (
                        <span className="absolute bottom-1 size-1.5 rounded-pill bg-ink" />
                      )}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div
          className="flex items-center gap-1.5"
          aria-label="Chú giải mức hoạt động"
          role="group"
        >
          <Text as="span" size="caption" color="secondary">
            Ít
          </Text>
          {([0, 1, 2, 3, 4] as Intensity[]).map((level) => (
            <span
              key={level}
              aria-hidden="true"
              className={cn(
                "size-4 rounded-sharp border border-border-strong",
                LEVEL_CLASSES[level],
              )}
            />
          ))}
          <Text as="span" size="caption" color="secondary">
            Nhiều
          </Text>
        </div>
        <Button size="compact" variant="outline" onClick={onToday}>
          Hôm nay
        </Button>
      </div>
    </div>
  );
}
