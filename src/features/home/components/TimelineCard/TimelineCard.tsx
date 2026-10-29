"use client";

import { useId, useState, type ComponentProps } from "react";
import { ArrowRight, Pause, Play, Plus, Rss } from "lucide-react";
import {
  AutoScroll,
  Button,
  Card,
  IconButton,
  Input,
  LinkButton,
  Text,
  cn,
} from "@/design-system";
import { DevlogActivityList } from "@/features/devlog/components/DevlogActivityList";
import { formatDevlogDate } from "@/features/devlog/status";
import type { DevlogEntry } from "@/features/devlog/types";
import {
  CreateLearningLogDialog,
  LearningLogDetailDialog,
  LearningLogList,
  latestLogDate,
  logsOnDate,
  useLearningLogs,
  type LearningLog,
} from "@/features/learning-log";

export interface TimelineCardProps extends Omit<
  ComponentProps<"section">,
  "children" | "ref"
> {
  /** Newest first; the newest day is shown until the visitor picks another. */
  entries: DevlogEntry[];
  devlogHref?: string;
  feedHref?: string;
}

const NOTICE_MS = 5000;

/**
 * One day's activity as a vertical timeline that drifts upwards by itself and
 * loops, inside a card of fixed height: the visitor's own learning logs first,
 * then the devlog entries of the same day. The day starts on the newest one
 * and can be changed with the date field. The buttons stay pinned to the
 * bottom of the card. The drift stops on hover and focus, and the pause button
 * stops it for good.
 */
export function TimelineCard({
  entries,
  devlogHref = "/devlog",
  feedHref = "/devlog/feed.xml",
  className,
  ...props
}: TimelineCardProps) {
  const titleId = useId();
  const logs = useLearningLogs();
  const [isPaused, setIsPaused] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [pickedDate, setPickedDate] = useState<string>();
  const [isComposing, setIsComposing] = useState(false);
  const [openedLog, setOpenedLog] = useState<LearningLog>();
  const [notice, setNotice] = useState<string>();

  const newestEntry = entries[0]?.date;
  const newestLog = latestLogDate(logs);
  const newest =
    newestEntry && newestLog
      ? newestEntry > newestLog
        ? newestEntry
        : newestLog
      : (newestEntry ?? newestLog);
  const day = pickedDate ?? newest;

  const dayEntries = day ? entries.filter((entry) => entry.date === day) : [];
  const dayLogs = day ? logsOnDate(logs, day) : [];
  const total = dayEntries.length + dayLogs.length;
  // Group titles only help when both kinds of activity share the day.
  const hasBoth = dayEntries.length > 0 && dayLogs.length > 0;

  function handleSaved(log: LearningLog) {
    // Jump to the day of the new log, or it could be saved out of sight.
    setPickedDate(log.learningDate);
    setNotice(`Đã lưu log “${log.title}”.`);
    setTimeout(() => setNotice(undefined), NOTICE_MS);
  }

  return (
    <Card
      as="section"
      aria-labelledby={titleId}
      className={cn("h-[30rem] rounded-soft lg:h-[36rem]", className)}
      {...props}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <Text as="h2" id={titleId} size="heading-md" weight="semibold">
            Nhật ký trong ngày
          </Text>
          {day && (
            <Text as="p" size="body-sm" color="secondary">
              Hoạt động ngày <time dateTime={day}>{formatDevlogDate(day)}</time>
              {` · ${total} mục`}
            </Text>
          )}
        </div>
        {isMoving && (
          <IconButton
            icon={isPaused ? Play : Pause}
            variant="outline"
            size="compact"
            aria-label={isPaused ? "Tiếp tục cuộn" : "Tạm dừng cuộn"}
            aria-pressed={isPaused}
            onClick={() => setIsPaused((current) => !current)}
          />
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="date"
          size="compact"
          aria-label="Chọn ngày xem nhật ký"
          value={day ?? ""}
          onChange={(event) => setPickedDate(event.target.value || undefined)}
          className="w-44"
        />
        {pickedDate && pickedDate !== newest && (
          <Button
            variant="ghost"
            size="compact"
            onClick={() => setPickedDate(undefined)}
          >
            Về ngày mới nhất
          </Button>
        )}
      </div>
      {notice && (
        <Text
          as="p"
          size="body-sm"
          role="status"
          className="rounded-standard bg-success-bg px-3 py-2 text-success-text"
        >
          {notice}
        </Text>
      )}
      <AutoScroll
        role="region"
        aria-label="Hoạt động trong ngày"
        isPaused={isPaused}
        onActiveChange={setIsMoving}
        className="min-h-0 flex-1"
      >
        {total === 0 ? (
          <Text as="p" size="body-md" color="secondary">
            Chưa có hoạt động nào được ghi lại.
          </Text>
        ) : (
          // The padding leaves room for the cards' shadows and the loop's gap.
          <div className="flex flex-col gap-4 p-1 pb-6">
            {dayLogs.length > 0 && (
              <div className="flex flex-col gap-2">
                {hasBoth && (
                  <Text
                    as="h3"
                    size="body-sm"
                    weight="semibold"
                    color="secondary"
                  >
                    Nhật ký học tập của bạn
                  </Text>
                )}
                <LearningLogList
                  logs={dayLogs}
                  onOpen={setOpenedLog}
                  aria-label="Nhật ký học tập của bạn"
                />
              </div>
            )}
            {dayEntries.length > 0 && (
              <div className="flex flex-col gap-2">
                {hasBoth && (
                  <Text
                    as="h3"
                    size="body-sm"
                    weight="semibold"
                    color="secondary"
                  >
                    Cập nhật devlog
                  </Text>
                )}
                <DevlogActivityList
                  entries={dayEntries}
                  showDates={false}
                  hrefFor={(slug) =>
                    `${devlogHref}?entry=${encodeURIComponent(slug)}`
                  }
                  aria-label="Hoạt động trong ngày"
                />
              </div>
            )}
          </div>
        )}
      </AutoScroll>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="accent"
          leftIcon={Plus}
          onClick={() => setIsComposing(true)}
        >
          Viết thêm Log
        </Button>
        <LinkButton href={devlogHref} variant="outline" rightIcon={ArrowRight}>
          Xem toàn bộ nhật ký
        </LinkButton>
        <LinkButton href={feedHref} variant="outline" leftIcon={Rss}>
          RSS
        </LinkButton>
      </div>

      {isComposing && (
        <CreateLearningLogDialog
          open
          onClose={() => setIsComposing(false)}
          onSaved={handleSaved}
        />
      )}
      {openedLog && (
        <LearningLogDetailDialog
          log={openedLog}
          onClose={() => setOpenedLog(undefined)}
        />
      )}
    </Card>
  );
}
