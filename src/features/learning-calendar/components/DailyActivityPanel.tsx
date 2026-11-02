import Link from "next/link";
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Dumbbell,
  Mic,
  Minus,
  NotebookPen,
  Pencil,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";
import { useDiaryLogs } from "@/features/english-diary";
import {
  Alert,
  Badge,
  Button,
  IconButton,
  Skeleton,
  Text,
  buttonVariants,
  cn,
} from "@/design-system";
import { formatLongDate, formatTime } from "../calendarDate";
import type { ActivityType, DayActivity, DayResponse } from "../types";

const ICONS: Record<ActivityType, LucideIcon> = {
  DAILY_LESSON: BookOpen,
  DAILY_PRACTICE: Dumbbell,
  DAILY_TEST: ClipboardCheck,
  PHRASE_WRITE: Pencil,
  PHRASE_RECALL: RefreshCw,
  PHRASE_SPEAK: Mic,
};

/** Where "start learning" goes: the learning area. It records nothing by itself. */
const START_LEARNING_HREF = "/learn";
const DIARY_LOGS_HREF = "/goals/english/diary";

function ActivityItem({ activity }: { activity: DayActivity }) {
  const Icon = ICONS[activity.type];
  const time = formatTime(activity.occurredAt);
  const body = (
    <>
      <Icon aria-hidden="true" size={24} className="shrink-0" />
      <div className="min-w-0 flex-1">
        <Text as="p" weight="bold" className="break-words">
          {activity.title}
        </Text>
        <Text as="p" size="body-sm" color="secondary" className="break-words">
          {activity.description}
          {time && ` · ${time}`}
        </Text>
      </div>
      <Badge
        size="sm"
        variant={activity.status === "COMPLETED" ? "lime" : "yellow"}
        icon={activity.status === "COMPLETED" ? Check : Minus}
      >
        {activity.status === "COMPLETED" ? "Hoàn thành" : "Đang làm"}
      </Badge>
    </>
  );
  const base =
    "flex items-center gap-3 rounded-standard border-2 border-border-strong bg-surface-card px-3 py-1.5 max-sm:flex-wrap";
  return (
    <li>
      {activity.targetUrl ? (
        // Only when the module has a screen for it; otherwise the item is read-only.
        <Link
          href={activity.targetUrl}
          className={cn(
            base,
            "hover:bg-surface-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-border-focus",
          )}
        >
          {body}
        </Link>
      ) : (
        <div className={base}>{body}</div>
      )}
    </li>
  );
}

/** English Logs written on the day, with a way into them. */
function DayLogs({ date }: { date: string }) {
  const logs = useDiaryLogs().filter(
    (log) => log.date === date && !log.isArchived,
  );
  if (logs.length === 0) return null;
  return (
    <section aria-labelledby="day-logs-title" className="flex flex-col gap-2">
      <Text
        as="h3"
        id="day-logs-title"
        size="body-lg"
        weight="bold"
        className="flex items-center gap-2 font-display"
      >
        <NotebookPen aria-hidden="true" size={20} />
        Ghi chép trong ngày
      </Text>
      <ul className="flex flex-col gap-1.5">
        {logs.map((log) => (
          <li key={log.id}>
            <Link
              href={DIARY_LOGS_HREF}
              className="flex items-center gap-3 rounded-standard border-2 border-border-strong bg-surface-card px-3 py-1.5 hover:bg-surface-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-border-focus"
            >
              <Text
                as="span"
                weight="bold"
                className="min-w-0 flex-1 break-words"
              >
                {log.title}
              </Text>
              <Badge
                size="sm"
                variant={log.status === "completed" ? "lime" : "yellow"}
              >
                {log.status === "completed" ? "Hoàn thành" : "Nháp"}
              </Badge>
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href={DIARY_LOGS_HREF}
        className="self-start text-body-sm font-semibold text-text-primary underline underline-offset-4"
      >
        Mở English Logs
      </Link>
    </section>
  );
}

function EmptyDay({
  isToday,
  isFuture,
}: {
  isToday: boolean;
  isFuture: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-4 text-center">
      {/* A decorative picture; the words below carry the meaning. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/mascot/panda-laptop.webp"
        alt=""
        width={160}
        height={121}
        className="h-auto w-40"
      />
      <Text as="p" size="heading-sm" weight="bold" className="font-display">
        {isToday ? "Hôm nay bạn chưa học gì." : "Ngày này bạn chưa học gì."}
      </Text>
      <Text color="secondary" className="max-w-xs">
        Duy trì thói quen mỗi ngày để xây dựng vốn tiếng Anh vững chắc hơn nhé!
      </Text>
      {!isFuture && (
        <Link
          href={START_LEARNING_HREF}
          className={cn(
            buttonVariants({ variant: "accent" }),
            "w-full sm:w-auto",
          )}
        >
          Bắt đầu học ngay
        </Link>
      )}
    </div>
  );
}

export interface DailyActivityPanelProps {
  date: string;
  today: string;
  /** Null while this day loads; a response for another day is never passed in. */
  data: DayResponse | null;
  isLoading: boolean;
  error: Error | undefined;
  onRetry: () => void;
  onPreviousDay: () => void;
  onNextDay: () => void;
  onToday: () => void;
}

/** What the user did on the chosen day, as a list. Loads and fails on its own, so the calendar stays up. */
export function DailyActivityPanel({
  date,
  today,
  data,
  isLoading,
  error,
  onRetry,
  onPreviousDay,
  onNextDay,
  onToday,
}: DailyActivityPanelProps) {
  const hasActivity = data?.hasActivity === true;
  return (
    <div className="flex min-w-0 flex-col gap-3" aria-busy={isLoading}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          <Text
            as="h2"
            size="heading-sm"
            weight="bold"
            className="font-display"
            aria-live="polite"
          >
            {formatLongDate(date)}
          </Text>
          {data && (
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={hasActivity ? "lime" : "default"}
                icon={hasActivity ? Check : Minus}
              >
                {hasActivity ? "Có hoạt động" : "Chưa có hoạt động"}
              </Badge>
              {hasActivity && (
                <Text as="span" size="body-sm" color="secondary">
                  {data.summary.activityCount} hoạt động
                </Text>
              )}
            </div>
          )}
        </div>
        <div
          className="flex items-center gap-1.5"
          role="group"
          aria-label="Chọn ngày"
        >
          <IconButton
            icon={ChevronLeft}
            variant="outline"
            size="compact"
            aria-label="Ngày trước"
            onClick={onPreviousDay}
          />
          <Button
            size="compact"
            variant="outline"
            aria-label="Về hôm nay"
            onClick={onToday}
          >
            Hôm nay
          </Button>
          <IconButton
            icon={ChevronRight}
            variant="outline"
            size="compact"
            aria-label="Ngày sau"
            disabled={date >= today}
            onClick={onNextDay}
          />
        </div>
      </div>

      {error && !data ? (
        <Alert variant="danger" title="Không thể tải hoạt động của ngày này">
          <div className="flex flex-wrap items-center gap-3">
            <span>Vui lòng thử lại sau.</span>
            <Button size="compact" variant="outline" onClick={onRetry}>
              Thử lại
            </Button>
          </div>
        </Alert>
      ) : !data ? (
        <div aria-hidden="true" className="flex flex-col gap-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : !hasActivity ? (
        <EmptyDay isToday={date === today} isFuture={date > today} />
      ) : (
        <>
          <section
            aria-labelledby="day-activities-title"
            className="flex flex-col gap-2"
          >
            <Text
              as="h3"
              id="day-activities-title"
              size="body-lg"
              className="sr-only"
              weight="semibold"
            >
              Hoạt động trong ngày
            </Text>
            <ul className="flex flex-col gap-1.5">
              {data.activities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </ul>
          </section>
        </>
      )}
      {data && <DayLogs date={date} />}
    </div>
  );
}
