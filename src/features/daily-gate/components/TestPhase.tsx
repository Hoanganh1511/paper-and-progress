"use client";

import { useEffect, useRef, useState } from "react";
import { Alert, Button, Text, cn } from "@/design-system";
import type { TestResponse, TestResult as TestResultData } from "../types";
import { ChoiceQuestion } from "./ChoiceQuestion";
import { TestResult } from "./TestResult";
import { Timer } from "./Timer";

export interface TestPhaseProps {
  test: TestResponse;
  /** Hands in the answers; throws with a message to show if it fails. */
  onSubmit: (
    answers: { questionId: number; selectedIndex: number }[],
  ) => Promise<TestResultData>;
  onClose: () => void;
  onRetry: () => void;
}

/** The gate test: timed, one question at a time, and no answer shown until it is handed in. */
export function TestPhase({
  test,
  onSubmit,
  onClose,
  onRetry,
}: TestPhaseProps) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<TestResultData>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const hasSubmitted = useRef(false);
  // Always the latest answers, so the timer can hand in what was chosen up to that moment.
  const latest = useRef(answers);
  useEffect(() => {
    latest.current = answers;
  });

  if (result) {
    return (
      <TestResult
        questions={test.questions}
        result={result}
        onClose={onClose}
        onRetry={onRetry}
      />
    );
  }

  const { questions } = test;
  const question = questions[index];
  const answeredCount = Object.keys(answers).length;
  const isComplete = answeredCount === questions.length;

  async function submit() {
    if (hasSubmitted.current) return;
    hasSubmitted.current = true;
    setIsSubmitting(true);
    setError(undefined);
    try {
      setResult(
        await onSubmit(
          Object.entries(latest.current).map(([questionId, selectedIndex]) => ({
            questionId: Number(questionId),
            selectedIndex,
          })),
        ),
      );
    } catch (caught) {
      hasSubmitted.current = false;
      setError(caught instanceof Error ? caught.message : "Có lỗi xảy ra.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col">
          <Text
            as="h2"
            size="heading-md"
            weight="bold"
            className="font-display"
          >
            Bài kiểm tra
          </Text>
          <Text size="body-sm" color="secondary">
            Lần {test.attempt} · cần đạt {test.passScore}% · không xem được đáp
            án cho tới khi nộp bài
          </Text>
        </div>
        <Timer
          seconds={test.timeLimit}
          onExpire={submit}
          isStopped={isSubmitting}
        />
      </div>

      <nav aria-label="Danh sách câu hỏi">
        <ol className="flex flex-wrap gap-1.5">
          {questions.map((item, position) => (
            <li key={item.id}>
              <button
                type="button"
                aria-label={`Câu ${position + 1}${answers[item.id] === undefined ? "" : " (đã trả lời)"}`}
                aria-current={position === index ? "step" : undefined}
                onClick={() => setIndex(position)}
                className={cn(
                  "flex size-9 cursor-pointer items-center justify-center rounded-standard border-2 text-caption font-bold transition-colors motion-reduce:transition-none",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-border-focus",
                  position === index
                    ? "border-border-strong bg-accent-yellow text-ink"
                    : answers[item.id] !== undefined
                      ? "border-border-strong bg-info-bg text-info-text"
                      : "border-border-subtle bg-surface-card text-text-secondary",
                )}
              >
                {position + 1}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <section
        aria-label={`Câu ${index + 1} trên ${questions.length}`}
        className="flex flex-col gap-3"
      >
        <Text
          size="body-sm"
          weight="semibold"
          color="secondary"
          aria-live="polite"
        >
          Câu {index + 1} / {questions.length}
        </Text>
        <ChoiceQuestion
          sentence={question.question}
          options={question.options}
          selected={answers[question.id]}
          isDisabled={isSubmitting}
          onSelect={(value) =>
            setAnswers((previous) => ({ ...previous, [question.id]: value }))
          }
        />
      </section>

      {error && <Alert variant="danger">{error}</Alert>}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          variant="outline"
          disabled={index === 0 || isSubmitting}
          onClick={() => setIndex(index - 1)}
        >
          Câu trước
        </Button>
        {index < questions.length - 1 ? (
          <Button disabled={isSubmitting} onClick={() => setIndex(index + 1)}>
            Câu sau
          </Button>
        ) : null}
        <Button
          variant="accent"
          size="comfortable"
          disabled={!isComplete}
          isLoading={isSubmitting}
          onClick={submit}
        >
          Nộp bài
        </Button>
      </div>
      {!isComplete && (
        <Text size="body-sm" color="secondary" className="text-right">
          Còn {questions.length - answeredCount} câu chưa trả lời.
        </Text>
      )}
    </div>
  );
}
