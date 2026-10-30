"use client";

import { useState } from "react";
import { Text, cn } from "@/design-system";
import type { MatchingQuestion as MatchingQuestionData } from "../types";

export interface MatchingQuestionProps {
  question: MatchingQuestionData;
  /** One meaning index per word; -1 while that word has none yet. */
  value: number[];
  onChange: (value: number[]) => void;
  /** After checking: the pairs turn green or red and can no longer change. */
  isChecked: boolean;
}

const row =
  "flex min-h-11 w-full cursor-pointer items-center rounded-standard border-2 px-3 py-2 text-left text-body-sm transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-border-focus disabled:cursor-default";

/** Pick a word on the left, then its meaning on the right. */
export function MatchingQuestion({
  question,
  value,
  onChange,
  isChecked,
}: MatchingQuestionProps) {
  const [active, setActive] = useState<number>();

  function choose(rightIndex: number) {
    if (active === undefined || isChecked) return;
    // A meaning belongs to one word: taking it from another word frees that word.
    const next = value.map((current) =>
      current === rightIndex ? -1 : current,
    );
    next[active] = rightIndex;
    onChange(next);
    setActive(undefined);
  }

  const leftOf = (rightIndex: number) =>
    value.findIndex((current) => current === rightIndex);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <ul aria-label="Từ và cụm từ" className="flex flex-col gap-2">
        {question.left.map((word, index) => {
          const paired = value[index] !== -1;
          const correct = isChecked && value[index] === question.answer[index];
          const wrong = isChecked && !correct;
          return (
            <li key={word}>
              <button
                type="button"
                disabled={isChecked}
                aria-pressed={active === index}
                onClick={() => setActive(index)}
                className={cn(
                  row,
                  "justify-between gap-2",
                  active === index && "border-border-strong bg-accent-yellow",
                  active !== index &&
                    !isChecked &&
                    "border-border-subtle bg-surface-card hover:bg-surface-sunken",
                  paired &&
                    active !== index &&
                    !isChecked &&
                    "border-border-strong bg-info-bg",
                  correct &&
                    "border-success-text bg-success-bg text-success-text",
                  wrong && "border-danger-text bg-danger-bg text-danger-text",
                )}
              >
                <span className="font-semibold">{word}</span>
                {paired && (
                  <span className="text-caption">
                    {String.fromCharCode(65 + value[index])}
                    {isChecked && (correct ? " ✓" : " ✕")}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <ul aria-label="Nghĩa" className="flex flex-col gap-2">
        {question.right.map((meaning, index) => {
          const owner = leftOf(index);
          return (
            <li key={meaning}>
              <button
                type="button"
                disabled={isChecked || active === undefined}
                onClick={() => choose(index)}
                className={cn(
                  row,
                  "gap-2 border-border-subtle bg-surface-card",
                  active !== undefined &&
                    !isChecked &&
                    "hover:border-border-strong hover:bg-surface-sunken",
                  owner !== -1 && "border-border-strong bg-info-bg",
                )}
              >
                <span aria-hidden="true" className="font-bold">
                  {String.fromCharCode(65 + index)}.
                </span>
                <span>{meaning}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {!isChecked && (
        <Text size="body-sm" color="secondary" className="sm:col-span-2">
          Chọn một từ bên trái, rồi chọn nghĩa của nó bên phải.
        </Text>
      )}
    </div>
  );
}
