"use client";

import { useState, type ReactNode } from "react";
import { Alert, Button, Skeleton } from "@/design-system";
import { useAdminQuery, type AdminQuery } from "@/features/admin/useAdminQuery";
import {
  completeLearn,
  getCalendar,
  getLearn,
  getPractice,
  getTest,
  submitPractice,
  submitTest,
} from "../dailyGateApi";
import type { Step } from "../display";
import type { ActiveToday, InactiveToday, TodayResponse } from "../types";
import { GateLanding } from "./GateLanding";
import { LearnPhase } from "./LearnPhase";
import { PracticePhase } from "./PracticePhase";
import { StatsView } from "./StatsView";
import { TestPhase } from "./TestPhase";

type View = "landing" | "stats" | Step;

const messageOf = (error: unknown) =>
  error instanceof Error ? error.message : "Có lỗi xảy ra. Thử lại sau.";

export interface DailyGatePanelProps {
  /** Today's lesson and progress; owned by the launcher so its button can show the same state. */
  today: AdminQuery<TodayResponse>;
  /** Re-reads today after a step was finished. */
  onRefresh: () => void;
  /** Closes the modal. */
  onClose: () => void;
}

/** The day's English lesson: learn, practice, then a test; 70% or more counts the day as done. */
export function DailyGatePanel({
  today,
  onRefresh,
  onClose,
}: DailyGatePanelProps) {
  const [version, setVersion] = useState(0);
  const [view, setView] = useState<View>("landing");

  const calendar = useAdminQuery(getCalendar, `calendar-${version}`);
  const refresh = () => {
    setVersion((current) => current + 1);
    onRefresh();
  };
  const toLanding = () => {
    refresh();
    setView("landing");
  };

  let body: ReactNode;
  if (today.error && !today.data) {
    body = (
      <Alert variant="danger" title="Không tải được bài học hôm nay">
        <div className="flex flex-wrap items-center gap-3">
          <span>{today.error.message}</span>
          <Button size="compact" variant="outline" onClick={today.reload}>
            Thử lại
          </Button>
        </div>
      </Alert>
    );
  } else if (!today.data) {
    body = (
      <div aria-busy="true" className="flex flex-col gap-4">
        <span role="status" className="sr-only">
          Đang tải
        </span>
        <Skeleton className="h-16 w-2/3" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  } else if (!today.data.active) {
    body = <NoLesson today={today.data} onClose={onClose} />;
  } else if (!today.data.isReady) {
    body = (
      <div className="flex flex-col items-start gap-3">
        <Alert variant="info" title="Nội dung bài học đang được chuẩn bị">
          Từ vựng của Day {today.data.dayNumber} chưa sẵn sàng, nên hôm nay chưa
          có bài.
        </Alert>
        <Button variant="accent" onClick={onClose}>
          Đóng
        </Button>
      </div>
    );
  } else if (view === "stats") {
    body = <StatsView onBack={() => setView("landing")} />;
  } else if (view === "learn") {
    body = (
      <LearnStep
        today={today.data}
        onDone={() => {
          refresh();
          setView("practice");
        }}
        onBack={toLanding}
      />
    );
  } else if (view === "practice") {
    body = (
      <PracticeStep
        today={today.data}
        onContinue={() => {
          refresh();
          setView("test");
        }}
        onBack={toLanding}
      />
    );
  } else if (view === "test") {
    body = (
      <TestStep
        today={today.data}
        onSubmitted={refresh}
        onClose={onClose}
        onBack={toLanding}
      />
    );
  } else {
    body = (
      <GateLanding
        today={today.data}
        calendar={calendar.data}
        onStart={setView}
        onClose={onClose}
        onShowStats={() => setView("stats")}
      />
    );
  }

  return <div className="flex flex-col gap-4">{body}</div>;
}

function NoLesson({
  today,
  onClose,
}: {
  today: InactiveToday;
  onClose: () => void;
}) {
  const text =
    today.reason === "NOT_STARTED"
      ? `Thử thách 30 ngày bắt đầu từ ${today.startDate}.`
      : today.reason === "FINISHED"
        ? "Bạn đã đi hết thử thách 30 ngày. Chúc mừng!"
        : "Hôm nay không có bài học.";
  return (
    <div className="flex flex-col items-start gap-3">
      <Alert variant="info" title="Không có bài học hôm nay">
        {text}
      </Alert>
      <Button variant="accent" onClick={onClose}>
        Đóng
      </Button>
    </div>
  );
}

/** Loads one phase's data and shows a skeleton, or the error with a way back. */
function PhaseFrame({
  isLoading,
  error,
  onRetry,
  onBack,
  children,
}: {
  isLoading: boolean;
  error: Error | undefined;
  onRetry: () => void;
  onBack: () => void;
  children: ReactNode;
}) {
  if (error) {
    return (
      <Alert variant="danger" title="Không tải được">
        <div className="flex flex-wrap items-center gap-3">
          <span>{error.message}</span>
          <Button size="compact" variant="outline" onClick={onRetry}>
            Thử lại
          </Button>
          <Button size="compact" variant="ghost" onClick={onBack}>
            Quay lại
          </Button>
        </div>
      </Alert>
    );
  }
  if (isLoading) {
    return (
      <div aria-busy="true" className="flex flex-col gap-4">
        <span role="status" className="sr-only">
          Đang tải
        </span>
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }
  return children;
}

function LearnStep({
  today,
  onDone,
  onBack,
}: {
  today: ActiveToday;
  onDone: () => void;
  onBack: () => void;
}) {
  const query = useAdminQuery(getLearn, "gate-learn");
  return (
    <PhaseFrame
      isLoading={!query.data}
      error={query.error}
      onRetry={query.reload}
      onBack={onBack}
    >
      {query.data && (
        <LearnPhase
          lesson={query.data}
          onBack={onBack}
          onComplete={async () => {
            try {
              await completeLearn(today.lessonId);
              onDone();
              return undefined;
            } catch (error) {
              return messageOf(error);
            }
          }}
        />
      )}
    </PhaseFrame>
  );
}

function PracticeStep({
  today,
  onContinue,
  onBack,
}: {
  today: ActiveToday;
  onContinue: () => void;
  onBack: () => void;
}) {
  const query = useAdminQuery(getPractice, "gate-practice");
  return (
    <PhaseFrame
      isLoading={!query.data}
      error={query.error}
      onRetry={query.reload}
      onBack={onBack}
    >
      {query.data && (
        <PracticePhase
          practice={query.data}
          onSubmit={(answers) => submitPractice(today.lessonId, answers)}
          onContinue={onContinue}
        />
      )}
    </PhaseFrame>
  );
}

function TestStep({
  today,
  onSubmitted,
  onClose,
  onBack,
}: {
  today: ActiveToday;
  onSubmitted: () => void;
  onClose: () => void;
  onBack: () => void;
}) {
  // A retry asks for a new test: the server hands out a new set after each attempt.
  const [attempt, setAttempt] = useState(0);
  const query = useAdminQuery(getTest, `gate-test-${attempt}`);
  return (
    <PhaseFrame
      isLoading={!query.data}
      error={query.error}
      onRetry={query.reload}
      onBack={onBack}
    >
      {query.data && (
        <TestPhase
          key={attempt}
          test={query.data}
          onClose={onClose}
          onRetry={() => setAttempt((current) => current + 1)}
          onSubmit={async (answers) => {
            const result = await submitTest(today.lessonId, answers);
            onSubmitted();
            return result;
          }}
        />
      )}
    </PhaseFrame>
  );
}
