"use client";

import { useEffect } from "react";
import { PartyPopper, RotateCcw } from "lucide-react";
import { Alert, Button, Text, cn } from "@/design-system";
import { OPTION_LETTERS, PASS_SCORE } from "../display";
import type { TestQuestion, TestResult as TestResultData } from "../types";

export interface TestResultProps {
  questions: TestQuestion[];
  result: TestResultData;
  /** Close the lesson (the day is done). */
  onClose: () => void;
  /** Start again with a new set of questions. */
  onRetry: () => void;
}

/** Fires confetti, unless the visitor asked for less motion. The library loads only when needed. */
async function celebrate() {
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  try {
    const { default: confetti } = await import("canvas-confetti");
    confetti({ particleCount: 140, spread: 80, origin: { y: 0.6 } });
  } catch {
    // The celebration is a nicety; never let it get in the way.
  }
}

/** The score, then each question with the answer you gave and the right one. */
export function TestResult({
  questions,
  result,
  onClose,
  onRetry,
}: TestResultProps) {
  const { passed, score } = result;
  const wrong = result.results.filter((item) => !item.correct);

  useEffect(() => {
    if (passed) void celebrate();
  }, [passed]);

  return (
    <div className="flex flex-col gap-6">
      <div
        role="status"
        className={cn(
          "flex flex-col items-center gap-2 rounded-standard border-2 border-border-strong p-6 text-center shadow-modal",
          passed ? "bg-accent-lime text-ink" : "bg-accent-pink text-ink",
        )}
      >
        {passed && <PartyPopper aria-hidden="true" size={36} />}
        <Text
          as="h2"
          size="heading-lg"
          weight="bold"
          className="font-display text-ink"
        >
          {passed ? "Hoàn thành bài hôm nay!" : "Chưa đạt, thử lại nhé"}
        </Text>
        <Text
          as="p"
          className="font-display text-[3.5rem] leading-none font-bold text-ink"
        >
          {score}%
        </Text>
        <Text as="p" size="body-md" className="text-ink">
          {passed
            ? "Bạn đã hoàn thành bài học hôm nay."
            : `Cần đạt ít nhất ${PASS_SCORE}% để tính là hoàn thành. Bạn trả lời đúng ${result.results.length - wrong.length}/${result.results.length} câu.`}
        </Text>
        <div className="mt-2">
          {passed ? (
            <Button size="comfortable" variant="primary" onClick={onClose}>
              Đóng
            </Button>
          ) : (
            <Button
              size="comfortable"
              variant="primary"
              leftIcon={RotateCcw}
              onClick={onRetry}
            >
              Làm lại bài kiểm tra
            </Button>
          )}
        </div>
      </div>

      <section aria-labelledby="review-title" className="flex flex-col gap-3">
        <Text as="h3" id="review-title" size="body-lg" weight="semibold">
          Chi tiết từng câu
        </Text>
        <ol className="flex flex-col gap-3">
          {result.results.map((item, index) => {
            const question = questions.find((q) => q.id === item.questionId);
            if (!question) return null;
            return (
              <li
                key={item.questionId}
                className={cn(
                  "flex flex-col gap-1 rounded-standard border-2 p-3",
                  item.correct
                    ? "border-success-text bg-success-bg"
                    : "border-danger-text bg-danger-bg",
                )}
              >
                <Text size="body-sm" weight="semibold" className="break-words">
                  {index + 1}. {question.question}{" "}
                  <span className="sr-only">
                    {item.correct ? "(đúng)" : "(sai)"}
                  </span>
                  <span aria-hidden="true">{item.correct ? "✓" : "✕"}</span>
                </Text>
                {!item.correct && (
                  <Text size="body-sm">
                    Bạn chọn:{" "}
                    <strong>
                      {item.yourAnswer === null
                        ? "(bỏ trống)"
                        : `${OPTION_LETTERS[item.yourAnswer]}. ${question.options[item.yourAnswer]}`}
                    </strong>
                  </Text>
                )}
                <Text size="body-sm">
                  Đáp án đúng:{" "}
                  <strong>
                    {OPTION_LETTERS[item.correctAnswer]}.{" "}
                    {question.options[item.correctAnswer]}
                  </strong>
                </Text>
                <Text size="body-sm" color="secondary">
                  {item.explanation}
                </Text>
              </li>
            );
          })}
        </ol>
        {wrong.length === 0 && (
          <Alert variant="success">Tuyệt vời, không sai câu nào!</Alert>
        )}
      </section>
    </div>
  );
}
