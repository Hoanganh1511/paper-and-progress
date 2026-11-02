"use client";

import { useState } from "react";
import { CalendarDays, Target } from "lucide-react";
import { Alert, Button, Card, Skeleton, Text } from "@/design-system";
import { useAdminQuery } from "@/features/admin/useAdminQuery";
import {
  addDays,
  monthOf,
  sameMonth,
  selectionForMonth,
  shiftMonth,
} from "../calendarDate";
import { getCalendar, getDayActivity } from "../learningCalendarApi";
import type { MonthRef } from "../types";
import { DailyActivityPanel } from "./DailyActivityPanel";
import { LearningOverview } from "./LearningOverview";
import { MonthlyCalendar } from "./MonthlyCalendar";

/**
 * The learning calendar on the English goals page: overview numbers, a month
 * of days coloured by how much was done, and the list of what was done on the
 * chosen day. It only reads what the server has recorded. The server's own
 * "today" is the one date everything agrees on.
 */
export function LearningCalendarSection() {
  // `undefined` means "the server's current month"; it is asked for without a month.
  const [view, setView] = useState<MonthRef>();
  const [picked, setPicked] = useState<string>();

  const calendar = useAdminQuery(
    () => getCalendar(view),
    `learning-calendar-${view ? `${view.year}-${view.month}` : "now"}`,
  );
  const today = calendar.data?.today;
  const shown: MonthRef | undefined = view ?? calendar.data?.month;
  // While another month loads the previous one is still in `data`: never show it under the new title.
  const monthData =
    calendar.data && shown && sameMonth(calendar.data.month, shown)
      ? calendar.data
      : null;
  const selected = picked ?? today;

  const day = useAdminQuery(
    () => (selected ? getDayActivity(selected) : Promise.resolve(null)),
    `learning-day-${selected ?? "none"}`,
  );
  const dayData = day.data && day.data.date === selected ? day.data : null;

  function selectDate(date: string) {
    setPicked(date);
    // Stepping over a month edge with the day arrows brings the calendar along.
    if (shown && !sameMonth(monthOf(date), shown)) setView(monthOf(date));
  }

  function goToMonth(target: MonthRef) {
    if (!today || !selected) return;
    setView(target);
    setPicked(selectionForMonth(target, selected, today));
  }

  function goToToday() {
    if (!today) return;
    setView(monthOf(today));
    setPicked(today);
  }

  const canGoNext = Boolean(
    today && shown && !sameMonth(shown, monthOf(today)),
  );

  return (
    <Card
      as="section"
      variant="elevated"
      padding="compact"
      aria-labelledby="learning-calendar-title"
      className="gap-3 p-2 sm:p-4"
    >
      <header className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-standard border-2 border-border-strong bg-accent-lime text-ink"
          >
            <CalendarDays size={22} />
          </span>
          {/* The page has no other title: this box is the page. */}
          <Text
            as="h1"
            id="learning-calendar-title"
            size="heading-md"
            weight="bold"
            className="font-display"
          >
            Nhật ký học Tiếng Anh
          </Text>
        </div>
        {calendar.data && (
          <Text
            as="p"
            weight="semibold"
            className="flex shrink-0 items-center gap-1.5"
          >
            <Target aria-hidden="true" size={18} />
            Mục tiêu {calendar.data.goal.level}
          </Text>
        )}
      </header>

      {calendar.error && !monthData ? (
        <Alert variant="danger" title="Không thể tải dữ liệu học tập">
          <div className="flex flex-wrap items-center gap-3">
            <span>Vui lòng thử lại sau.</span>
            <Button size="compact" variant="outline" onClick={calendar.reload}>
              Thử lại
            </Button>
          </div>
        </Alert>
      ) : (
        <div className="grid gap-4 lg:gap-5 lg:grid-cols-2 xl:grid-cols-[minmax(0,28fr)_minmax(0,32fr)_minmax(0,40fr)]">
          <LearningOverview data={monthData} monthNumber={shown?.month ?? 0} />

          {shown && today && selected ? (
            <MonthlyCalendar
              month={shown}
              days={monthData?.days ?? []}
              isLoading={!monthData}
              today={today}
              selected={selected}
              canGoNext={canGoNext}
              onSelect={selectDate}
              onPreviousMonth={() => goToMonth(shiftMonth(shown, -1))}
              onNextMonth={() => goToMonth(shiftMonth(shown, 1))}
              onToday={goToToday}
            />
          ) : (
            <div aria-hidden="true" className="flex flex-col gap-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-72 w-full" />
            </div>
          )}

          <div className="lg:col-span-2 xl:col-span-1 xl:border-l-2 xl:border-border-subtle xl:pl-6">
            {selected && today ? (
              <DailyActivityPanel
                date={selected}
                today={today}
                data={dayData}
                isLoading={day.isLoading}
                error={day.error}
                onRetry={day.reload}
                onPreviousDay={() => selectDate(addDays(selected, -1))}
                onNextDay={() => selectDate(addDays(selected, 1))}
                onToday={goToToday}
              />
            ) : (
              <div aria-hidden="true" className="flex flex-col gap-3">
                <Skeleton className="h-10 w-2/3" />
                <Skeleton className="h-40 w-full" />
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
