import { CalendarDays, Flame, Trophy, type LucideIcon } from "lucide-react";
import { ProgressBar, Skeleton, Text } from "@/design-system";
import type { CalendarResponse } from "../types";

function StatCard({
  icon: Icon,
  value,
  label,
  iconClassName,
}: {
  icon: LucideIcon;
  value: number;
  label: string;
  iconClassName: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-standard border-2 border-border-subtle bg-surface-muted px-3 py-2 max-sm:flex-col max-sm:justify-center max-sm:gap-1 max-sm:text-center">
      <Icon aria-hidden="true" size={28} className={iconClassName} />
      <div className="min-w-0">
        <Text
          as="p"
          className="font-display text-heading-md leading-none font-bold"
        >
          {value}
        </Text>
        <Text as="p" size="body-sm" color="secondary" className="mt-0.5">
          {label}
        </Text>
      </div>
    </div>
  );
}

export interface LearningOverviewProps {
  /** Null while the month loads. */
  data: CalendarResponse | null;
  monthNumber: number;
}

/**
 * The three numbers of the overview and how many days of the shown month had
 * learning. The streak is the overall learning streak, a different number from
 * the Phrase Book's own streak.
 */
export function LearningOverview({ data, monthNumber }: LearningOverviewProps) {
  if (!data) {
    return (
      <div aria-hidden="true" className="flex flex-col gap-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }
  const { summary, month } = data;
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2 lg:grid-cols-1">
        <StatCard
          icon={Flame}
          value={summary.currentStreak}
          label="Ngày streak hiện tại"
          iconClassName="text-accent-pink"
        />
        <StatCard
          icon={Trophy}
          value={summary.longestStreak}
          label="Streak dài nhất"
          iconClassName="text-accent-yellow"
        />
        <StatCard
          icon={CalendarDays}
          value={summary.learningDaysInMonth}
          label={`Ngày học trong tháng ${monthNumber}`}
          iconClassName="text-activity-4"
        />
      </div>
      {/* Decoration on wide screens only; it never covers a number. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/mascot/panda-laptop.webp"
        alt=""
        width={120}
        height={91}
        className="hidden h-auto w-28 self-center lg:block [@media(max-height:760px)]:lg:hidden"
      />
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline justify-between gap-2">
          <Text size="body-sm" weight="semibold">
            Tiến độ tháng {monthNumber}
          </Text>
          <Text size="body-sm" weight="semibold">
            {summary.learningDaysInMonth} / {month.daysInMonth} ngày
          </Text>
        </div>
        <ProgressBar
          value={(summary.learningDaysInMonth / month.daysInMonth) * 100}
          label={`${summary.learningDaysInMonth} trên ${month.daysInMonth} ngày trong tháng ${monthNumber} có học`}
        />
      </div>
    </div>
  );
}
