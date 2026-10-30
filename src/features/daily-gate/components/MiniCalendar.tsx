import { Check, Lock, Star } from "lucide-react";
import { cn } from "@/design-system";
import type { CalendarDay } from "../types";

export interface MiniCalendarProps {
  days: CalendarDay[];
}

/** The 30 days as a grid: ✓ done, ★ today, 🔒 not reached or missed. */
export function MiniCalendar({ days }: MiniCalendarProps) {
  return (
    <ol
      aria-label="Lịch 30 ngày"
      className="grid grid-cols-6 gap-1.5 sm:grid-cols-10"
    >
      {days.map((day) => {
        const state = day.completed
          ? `đã hoàn thành${day.score === null ? "" : `, ${day.score} điểm`}`
          : day.isToday
            ? "hôm nay"
            : day.isPast
              ? "bỏ lỡ"
              : "chưa tới";
        return (
          <li
            key={day.dayNumber}
            title={`Ngày ${day.dayNumber}: ${day.topic}`}
            aria-label={`Ngày ${day.dayNumber}, ${day.topic}, ${state}`}
            aria-current={day.isToday ? "date" : undefined}
            className={cn(
              "flex aspect-square flex-col items-center justify-center rounded-standard border-2 text-caption font-semibold",
              day.completed &&
                "border-border-strong bg-success-bg text-success-text",
              day.isToday &&
                !day.completed &&
                "border-border-strong bg-accent-yellow text-ink shadow-raised",
              !day.completed &&
                !day.isToday &&
                "border-border-subtle bg-surface-card text-text-muted",
            )}
          >
            <span aria-hidden="true">{day.dayNumber}</span>
            <span aria-hidden="true">
              {day.completed ? (
                <Check size={12} strokeWidth={3} />
              ) : day.isToday ? (
                <Star size={12} />
              ) : (
                <Lock size={10} />
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
