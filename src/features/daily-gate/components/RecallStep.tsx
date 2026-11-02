"use client";

import { useState, type FormEvent } from "react";
import {
  Alert,
  Button,
  FormField,
  Input,
  Text,
  Textarea,
  cn,
} from "@/design-system";
import { reviewPhrase } from "../dailyGateApi";
import { PHRASE_STAGE_LABELS, formatShortDate } from "../display";
import { containsPhrase, isSamePhrase } from "../phraseMatcher";
import type { Phrase, RecallGrade } from "../types";
import { SentenceCheck } from "./SentenceCheck";

const GRADES: { value: RecallGrade; label: string }[] = [
  { value: "FORGOT", label: "Quên" },
  { value: "HARD", label: "Khó" },
  { value: "EASY", label: "Dễ" },
];

/** The grades a user may pick, same rule as the server. */
export function allowedGrades(
  isAnswerCorrect: boolean,
  usedHint: boolean,
): RecallGrade[] {
  if (!isAnswerCorrect) return ["FORGOT"];
  if (usedHint) return ["FORGOT", "HARD"];
  return ["FORGOT", "HARD", "EASY"];
}

/** "meet a deadline" -> "m___ a d______" */
const hintOf = (phrase: string) =>
  phrase
    .split(/\s+/)
    .map((word) => word[0] + "_".repeat(Math.max(word.length - 1, 0)))
    .join(" ");

export interface RecallStepProps {
  phrase: Phrase;
  onReviewed: (phrase: Phrase) => void;
}

/**
 * Step 3: see only the meaning, type the phrase from memory, say how it went.
 * "Hard" and "Easy" ask for a new sentence, so the phrase is used, not just seen.
 */
export function RecallStep({ phrase, onReviewed }: RecallStepProps) {
  const [answer, setAnswer] = useState("");
  const [usedHint, setUsedHint] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [grade, setGrade] = useState<RecallGrade>();
  const [sentence, setSentence] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [done, setDone] = useState<Phrase>();

  const isAnswerCorrect = isSamePhrase(phrase.phrase, answer);
  const allowed = allowedGrades(isAnswerCorrect, usedHint);
  const needsSentence = grade === "HARD" || grade === "EASY";
  const canSave =
    isChecked &&
    grade !== undefined &&
    allowed.includes(grade) &&
    (!needsSentence || containsPhrase(phrase.phrase, sentence));

  function handleCheck(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!answer.trim() || isChecked) return;
    setIsChecked(true);
    // After a wrong answer the only grade left is "Quên"; preselect it.
    if (!isAnswerCorrect) setGrade("FORGOT");
  }

  async function handleSave() {
    if (!canSave || !grade) return;
    setIsSaving(true);
    setError(undefined);
    try {
      const result = await reviewPhrase(phrase.id, {
        answer: answer.trim(),
        usedHint,
        grade,
        sentence: needsSentence ? sentence.trim() : undefined,
      });
      setDone(result.phrase);
      onReviewed(result.phrase);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Không lưu được kết quả.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (done) {
    return (
      <Alert variant="success" title="Đã ghi nhận">
        Trạng thái: {PHRASE_STAGE_LABELS[done.stage]}. Ôn lại vào{" "}
        {formatShortDate(done.nextReviewAt)}.
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleCheck} noValidate className="flex flex-col gap-4">
        <FormField
          label="Gõ lại cụm từ"
          required
          description={`Nghĩa / gợi nhớ của bạn: ${phrase.meaning}`}
        >
          <Input
            value={answer}
            lang="en"
            autoComplete="off"
            readOnly={isChecked}
            onChange={(event) => setAnswer(event.target.value)}
          />
        </FormField>
        {usedHint && !isChecked && (
          <Text as="p" size="body-md" lang="en" className="font-mono">
            Gợi ý: {hintOf(phrase.phrase)}
          </Text>
        )}
        {!isChecked && (
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="outline"
              disabled={usedHint}
              onClick={() => setUsedHint(true)}
            >
              Gợi ý
            </Button>
            <Button type="submit" variant="accent" disabled={!answer.trim()}>
              Kiểm tra
            </Button>
          </div>
        )}
      </form>

      {isChecked && (
        <>
          <Alert
            variant={isAnswerCorrect ? "success" : "warning"}
            title={isAnswerCorrect ? "Đúng rồi" : "Chưa đúng"}
          >
            Cụm từ là “{phrase.phrase}”.
            {usedHint &&
              isAnswerCorrect &&
              " Bạn đã dùng gợi ý nên không chọn được “Dễ”."}
            {!isAnswerCorrect && " Chỉ có thể chọn “Quên”."}
          </Alert>

          <div
            role="group"
            aria-label="Bạn nhớ cụm từ này thế nào?"
            className="flex flex-wrap gap-2"
          >
            {GRADES.map((item) => (
              <Button
                key={item.value}
                variant="secondary"
                aria-pressed={grade === item.value}
                disabled={!allowed.includes(item.value)}
                onClick={() => setGrade(item.value)}
                className={cn(grade === item.value && "bg-accent-lime")}
              >
                {item.label}
              </Button>
            ))}
          </div>

          {needsSentence && (
            <>
              <FormField
                label="Một câu mới với cụm từ"
                required
                description="Khác với các câu bạn đã viết trước đó."
              >
                <Textarea
                  value={sentence}
                  lang="en"
                  rows={3}
                  autoComplete="off"
                  onChange={(event) => setSentence(event.target.value)}
                />
              </FormField>
              <SentenceCheck phrase={phrase.phrase} sentence={sentence} />
            </>
          )}

          {error && <Alert variant="danger">{error}</Alert>}
          <div className="flex justify-end">
            <Button
              variant="accent"
              isLoading={isSaving}
              disabled={!canSave}
              onClick={handleSave}
            >
              Lưu kết quả
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
