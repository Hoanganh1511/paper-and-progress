"use client";

import { BarChart3, BookOpen, Lock, PartyPopper } from "lucide-react";
import { Button, ProgressBar, Skeleton, Text } from "@/design-system";
import {
  LESSON_TYPE_LABELS,
  STEPS,
  nextStep,
  topicOf,
  type Step,
} from "../display";
import type { ActiveToday, CalendarDay } from "../types";
import { MiniCalendar } from "./MiniCalendar";
import { StepIndicator } from "./StepIndicator";

export interface GateLandingProps {
  today: ActiveToday;
  calendar: CalendarDay[] | undefined;
  onStart: (step: Step) => void;
  onClose: () => void;
  onShowStats: () => void;
}

const START_LABELS: Record<Step, string> = {
  learn: "Bắt đầu học",
  practice: "Tiếp tục: Luyện tập",
  test: "Tiếp tục: Làm bài kiểm tra",
};

/** The welcome screen: which day it is, the calendar, the three steps and the button to start. */
export function GateLanding({
  today,
  calendar,
  onStart,
  onClose,
  onShowStats,
}: GateLandingProps) {
  const step = nextStep(today.progress);
  const completedDays = calendar?.filter((day) => day.completed).length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <Text
              as="h3"
              size="heading-lg"
              weight="bold"
              className="font-display"
            >
              Day {today.dayNumber} / 30
            </Text>
            <Text size="body-lg" weight="semibold">
              {topicOf(today)}
            </Text>
            <Text size="body-sm" color="secondary">
              {LESSON_TYPE_LABELS[today.type]} · {today.totalWords} từ
            </Text>
          </div>
          <Button
            variant="outline"
            size="compact"
            leftIcon={BarChart3}
            onClick={onShowStats}
          >
            Thống kê
          </Button>
        </div>
        <ProgressBar
          value={(completedDays / 30) * 100}
          label={`Tiến độ 30 ngày: ${completedDays} trên 30 ngày`}
        />
        {today.type === "REVIEW" && (
          <Text
            size="body-md"
            className="rounded-standard border-2 border-border-strong bg-accent-blue p-3 text-ink"
          >
            <strong>Review Day</strong> — Ôn tập:{" "}
            {today.units.map((unit) => unit.topic).join(", ")}
          </Text>
        )}
        {today.type === "FINAL_TEST" && (
          <Text
            size="body-md"
            className="rounded-standard border-2 border-border-strong bg-accent-pink p-3 text-ink"
          >
            <strong>Final Test</strong> — kiểm tra toàn bộ 30 câu, tất cả các
            unit.
          </Text>
        )}
      </header>

      {calendar ? (
        <MiniCalendar days={calendar} />
      ) : (
        <Skeleton className="h-24 w-full" />
      )}

      <StepIndicator
        progress={today.progress}
        current={step === "done" ? undefined : step}
      />

      {step === "done" ? (
        <div className="flex flex-col items-center gap-3 rounded-standard border-2 border-border-strong bg-accent-lime p-6 text-center text-ink shadow-modal">
          <PartyPopper aria-hidden="true" size={32} />
          <Text
            as="h2"
            size="heading-md"
            weight="bold"
            className="font-display text-ink"
          >
            ✅ Đã hoàn thành hôm nay!
          </Text>
          <Text className="text-ink">
            Điểm của bạn:{" "}
            <strong>
              {today.progress.bestScore ?? today.progress.testScore}%
            </strong>
          </Text>
          <Button size="comfortable" variant="primary" onClick={onClose}>
            Đóng
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <Button
            size="comfortable"
            variant="accent"
            leftIcon={BookOpen}
            onClick={() => onStart(step)}
          >
            {START_LABELS[step]}
          </Button>
          <Text
            size="body-sm"
            color="secondary"
            className="flex items-center gap-1.5"
          >
            <Lock aria-hidden="true" size={14} />
            Hoàn thành {STEPS.length} bước và đạt từ 70% ở bài kiểm tra để tính
            là xong bài hôm nay.
          </Text>
        </div>
      )}
    </div>
  );
}
