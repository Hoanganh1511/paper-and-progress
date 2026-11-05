"use client";

import { useId, useState, type ComponentProps } from "react";
import { Pause, Play, Plus } from "lucide-react";
import {
  DatePicker,
  datePickerLabelsVi,
  AutoScroll,
  Button,
  Card,
  IconButton,
  Text,
  cn,
} from "@/design-system";
import {
  CreateLearningLogDialog,
  LearningLogDetailDialog,
  LearningLogList,
  formatLogDate,
  latestLogDate,
  logsOnDate,
  useLearningLogs,
  type LearningLog,
} from "@/features/learning-log";

export type TimelineCardProps = Omit<
  ComponentProps<"section">,
  "children" | "ref"
>;

const NOTICE_MS = 5000;

/**
 * One day of the visitor's own learning logs as a vertical timeline that
 * drifts upwards by itself and loops, inside a card 80% of the viewport tall.
 * The day starts on the newest one with a log and can be changed with the
 * date field. The button stays pinned to the bottom of the card. The drift
 * stops on hover and focus, and the pause button stops it for good.
 */
export function TimelineCard({ className, ...props }: TimelineCardProps) {
  const titleId = useId();
  const logs = useLearningLogs();
  const [isPaused, setIsPaused] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [pickedDate, setPickedDate] = useState<string>();
  const [isComposing, setIsComposing] = useState(false);
  const [openedLog, setOpenedLog] = useState<LearningLog>();
  const [notice, setNotice] = useState<string>();

  const newest = latestLogDate(logs);
  const day = pickedDate ?? newest;
  const dayLogs = day ? logsOnDate(logs, day) : [];

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
      // 80% of the viewport, set in CSS alone: no script measures it, so the
      // card is the same size before and after it loads and the page does not
      // shift. `dvh` follows a mobile browser's collapsing address bar.
      className={cn("h-[80dvh] min-h-[26rem] rounded-soft", className)}
      {...props}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <Text as="h2" id={titleId} size="heading-md" weight="semibold">
            Nhật ký trong ngày
          </Text>
          {day && (
            <Text as="p" size="body-sm" color="secondary">
              Hoạt động ngày <time dateTime={day}>{formatLogDate(day)}</time>
              {` · ${dayLogs.length} mục`}
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
        <DatePicker
          size="compact"
          aria-label="Chọn ngày xem nhật ký"
          value={day ?? ""}
          onValueChange={(next) => setPickedDate(next || undefined)}
          isClearable={false}
          labels={datePickerLabelsVi}
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
        {dayLogs.length === 0 ? (
          <Text as="p" size="body-md" color="secondary">
            Chưa có hoạt động nào được ghi lại.
          </Text>
        ) : (
          // The padding leaves room for the cards' shadows and the loop's gap.
          <div className="flex flex-col gap-4 p-1 pb-6">
            <LearningLogList
              logs={dayLogs}
              onOpen={setOpenedLog}
              aria-label="Nhật ký học tập của bạn"
            />
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
