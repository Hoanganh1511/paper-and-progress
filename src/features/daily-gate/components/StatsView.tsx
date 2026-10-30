"use client";

import { Alert, Button, Card, Skeleton, Text } from "@/design-system";
import { useAdminQuery } from "@/features/admin/useAdminQuery";
import { getCalendar, getStats } from "../dailyGateApi";
import type { CalendarDay } from "../types";

export interface StatsViewProps {
  onBack: () => void;
}

function Figure({ label, value }: { label: string; value: string | number }) {
  return (
    <Card padding="compact" className="gap-1">
      <Text size="body-sm" color="secondary">
        {label}
      </Text>
      <Text as="p" className="font-display text-heading-lg font-bold">
        {value}
      </Text>
    </Card>
  );
}

/** A line of the best score of each day that has one. */
function ScoreChart({ days }: { days: CalendarDay[] }) {
  const scored = days.filter((day) => day.score !== null);
  if (scored.length === 0) {
    return (
      <Text size="body-sm" color="secondary">
        Chưa có điểm nào. Hoàn thành bài kiểm tra đầu tiên để xem biểu đồ.
      </Text>
    );
  }
  const width = 300;
  const height = 100;
  const x = (dayNumber: number) => 8 + ((dayNumber - 1) / 29) * (width - 16);
  const y = (score: number) => height - 8 - (score / 100) * (height - 16);
  const points = scored.map(
    (day) => `${x(day.dayNumber)},${y(day.score as number)}`,
  );

  return (
    <svg
      role="img"
      aria-label={`Điểm kiểm tra theo ngày: ${scored
        .map((day) => `ngày ${day.dayNumber} được ${day.score} điểm`)
        .join(", ")}`}
      viewBox={`0 0 ${width} ${height}`}
      className="h-32 w-full"
    >
      <line
        x1="8"
        x2={width - 8}
        y1={y(70)}
        y2={y(70)}
        stroke="currentColor"
        strokeDasharray="4 3"
        opacity="0.4"
      />
      <text
        x={width - 8}
        y={y(70) - 3}
        textAnchor="end"
        fontSize="8"
        fill="currentColor"
        opacity="0.6"
      >
        70%
      </text>
      {points.length > 1 && (
        <polyline
          points={points.join(" ")}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
      )}
      {scored.map((day) => (
        <circle
          key={day.dayNumber}
          cx={x(day.dayNumber)}
          cy={y(day.score as number)}
          r="3.5"
          fill="var(--color-accent-lime)"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      ))}
    </svg>
  );
}

/** Totals, streaks, the words that went wrong most often, and the score chart. */
export function StatsView({ onBack }: StatsViewProps) {
  const stats = useAdminQuery(getStats, "gate-stats");
  const calendar = useAdminQuery(getCalendar, "gate-calendar-stats");
  const data = stats.data;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-2">
        <Text as="h2" size="heading-md" weight="bold" className="font-display">
          Thống kê
        </Text>
        <Button variant="outline" size="compact" onClick={onBack}>
          Quay lại
        </Button>
      </div>

      {stats.error && !data ? (
        <Alert variant="danger" title="Không tải được thống kê">
          <Button size="compact" variant="outline" onClick={stats.reload}>
            Thử lại
          </Button>
        </Alert>
      ) : !data ? (
        <div aria-busy="true" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <span role="status" className="sr-only">
            Đang tải
          </span>
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Figure
              label="Ngày đã hoàn thành"
              value={`${data.completedDays} / ${data.totalDays}`}
            />
            <Figure label="Chuỗi ngày hiện tại" value={data.currentStreak} />
            <Figure label="Chuỗi dài nhất" value={data.longestStreak} />
            <Figure
              label="Điểm trung bình"
              value={data.averageScore === null ? "—" : `${data.averageScore}%`}
            />
            <Figure label="Từ đã học" value={data.totalWordsLearned} />
          </div>

          <Card as="section" aria-labelledby="chart-title" padding="compact">
            <Text as="h3" id="chart-title" size="body-lg" weight="semibold">
              Điểm kiểm tra theo ngày
            </Text>
            {calendar.data ? (
              <ScoreChart days={calendar.data} />
            ) : (
              <Skeleton className="h-32 w-full" />
            )}
          </Card>

          <Card as="section" aria-labelledby="weak-title" padding="compact">
            <Text as="h3" id="weak-title" size="body-lg" weight="semibold">
              10 từ hay sai nhất
            </Text>
            {data.weakWords.length === 0 ? (
              <Text size="body-sm" color="secondary">
                Chưa có từ nào bị sai.
              </Text>
            ) : (
              <ol className="flex flex-col divide-y-2 divide-border-subtle">
                {data.weakWords.map((word) => (
                  <li
                    key={word.wordId}
                    className="flex items-baseline justify-between gap-3 py-2"
                  >
                    <span className="min-w-0">
                      <strong>{word.word}</strong>
                      <span className="block text-body-sm text-text-secondary">
                        {word.meaning}
                      </span>
                    </span>
                    <span className="shrink-0 text-body-sm font-semibold text-danger-text">
                      sai {word.wrongCount} lần
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
