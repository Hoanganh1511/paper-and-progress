"use client";

import { useState } from "react";
import { Alert, Button, ProgressBar, Text } from "@/design-system";
import type {
  PracticeAnswerValue,
  PracticeQuestion,
  PracticeResponse,
  PracticeResult,
} from "../types";
import { ChoiceQuestion } from "./ChoiceQuestion";
import { MatchingQuestion } from "./MatchingQuestion";

export interface PracticePhaseProps {
  practice: PracticeResponse;
  /** Sends the answers; resolves to the result, or throws with a message to show. */
  onSubmit: (
    answers: { questionId: number; answer: PracticeAnswerValue }[],
  ) => Promise<PracticeResult>;
  onContinue: () => void;
}

const INSTRUCTIONS: Record<PracticeQuestion["type"], string> = {
  MATCHING: "Ghép từ với nghĩa",
  FILL_BLANK: "Điền từ vào chỗ trống",
  CHOOSE_CONTRAST: "Chọn từ đúng",
};

/** Fifteen exercises, one at a time, with the answer shown after each one; no minimum score. */
export function PracticePhase({
  practice,
  onSubmit,
  onContinue,
}: PracticePhaseProps) {
  const { questions } = practice;
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, PracticeAnswerValue>>(
    {},
  );
  const [checked, setChecked] = useState<ReadonlySet<number>>(new Set());
  const [result, setResult] = useState<PracticeResult>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  if (result) {
    return (
      <PracticeSummary
        questions={questions}
        result={result}
        onContinue={onContinue}
      />
    );
  }
  if (questions.length === 0) {
    return <Alert variant="warning" title="Chưa có bài tập cho hôm nay" />;
  }

  const question = questions[index];
  const isChecked = checked.has(question.id);
  const isLast = index === questions.length - 1;
  const answer = answers[question.id];
  const pairs =
    question.type === "MATCHING"
      ? Array.isArray(answer)
        ? answer
        : question.left.map(() => -1)
      : [];

  function check() {
    setChecked((previous) => new Set(previous).add(question.id));
  }

  async function submit() {
    setIsSubmitting(true);
    setError(undefined);
    try {
      setResult(
        await onSubmit(
          questions.map((item) => ({
            questionId: item.id,
            answer:
              answers[item.id] ??
              (item.type === "MATCHING" ? item.left.map(() => -1) : -1),
          })),
        ),
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Có lỗi xảy ra.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Text as="h2" size="heading-md" weight="bold" className="font-display">
          Luyện tập
        </Text>
        <Text size="body-md" weight="semibold" aria-live="polite">
          Câu {index + 1} / {questions.length}
        </Text>
      </div>
      <ProgressBar
        value={((index + (isChecked ? 1 : 0)) / questions.length) * 100}
        label="Tiến độ luyện tập"
      />

      <section aria-label={`Câu ${index + 1}`} className="flex flex-col gap-4">
        <Text
          size="body-sm"
          weight="semibold"
          color="secondary"
          className="uppercase"
        >
          {INSTRUCTIONS[question.type]}
        </Text>
        {question.type === "MATCHING" ? (
          <>
            <MatchingQuestion
              question={question}
              value={pairs}
              isChecked={isChecked}
              onChange={(value) =>
                setAnswers((previous) => ({
                  ...previous,
                  [question.id]: value,
                }))
              }
            />
            {!isChecked && (
              <div>
                <Button
                  variant="accent"
                  disabled={pairs.some((value) => value === -1)}
                  onClick={check}
                >
                  Kiểm tra
                </Button>
              </div>
            )}
          </>
        ) : (
          <ChoiceQuestion
            sentence={question.sentence}
            options={question.options}
            selected={typeof answer === "number" ? answer : undefined}
            correctIndex={question.correctIndex}
            explanation={question.explanation}
            onSelect={(value) => {
              setAnswers((previous) => ({ ...previous, [question.id]: value }));
              check();
            }}
          />
        )}
      </section>

      {error && <Alert variant="danger">{error}</Alert>}

      <div className="flex justify-end">
        {isLast ? (
          <Button
            size="comfortable"
            variant="accent"
            disabled={!isChecked}
            isLoading={isSubmitting}
            onClick={submit}
          >
            Xem kết quả
          </Button>
        ) : (
          <Button
            size="comfortable"
            disabled={!isChecked}
            onClick={() => setIndex(index + 1)}
          >
            Câu tiếp
          </Button>
        )}
      </div>
    </div>
  );
}

function PracticeSummary({
  questions,
  result,
  onContinue,
}: {
  questions: PracticeQuestion[];
  result: PracticeResult;
  onContinue: () => void;
}) {
  const missed = result.details
    .filter((detail) => !detail.correct)
    .flatMap((detail) => {
      const question = questions.find((item) => item.id === detail.questionId);
      return question ? [{ detail, question }] : [];
    });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-1 rounded-standard border-2 border-border-strong bg-accent-lime p-6 text-center text-ink shadow-modal">
        <Text
          as="h2"
          size="heading-md"
          weight="bold"
          className="font-display text-ink"
        >
          Hoàn thành luyện tập
        </Text>
        <Text
          as="p"
          className="font-display text-[3rem] leading-none font-bold text-ink"
        >
          {result.score}%
        </Text>
      </div>

      {missed.length > 0 ? (
        <section aria-labelledby="missed-title" className="flex flex-col gap-3">
          <Text as="h3" id="missed-title" size="body-lg" weight="semibold">
            Những câu cần xem lại ({missed.length})
          </Text>
          <ul className="flex flex-col gap-2">
            {missed.map(({ question }) => (
              <li
                key={question.id}
                className="rounded-standard border-2 border-border-strong bg-surface-card p-3"
              >
                {question.type === "MATCHING" ? (
                  <ul className="flex flex-col gap-1 text-body-sm">
                    {question.left.map((word, i) => (
                      <li key={word}>
                        <strong>{word}</strong>:{" "}
                        {question.right[question.answer[i]]}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <>
                    <Text size="body-sm" className="break-words">
                      {question.sentence}
                    </Text>
                    <Text
                      size="body-sm"
                      weight="semibold"
                      className="text-success-text"
                    >
                      Đáp án: {question.options[question.correctIndex]}
                    </Text>
                    <Text size="body-sm" color="secondary">
                      {question.explanation}
                    </Text>
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <Text color="secondary" className="text-center">
          Bạn trả lời đúng tất cả!
        </Text>
      )}

      <div className="flex justify-center">
        <Button size="comfortable" variant="accent" onClick={onContinue}>
          Tiếp tục làm bài kiểm tra
        </Button>
      </div>
    </div>
  );
}
