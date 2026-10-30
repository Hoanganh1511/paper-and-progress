import { Alert, Text, cn } from "@/design-system";
import { OPTION_LETTERS } from "../display";

export interface ChoiceQuestionProps {
  sentence: string;
  options: string[];
  selected: number | undefined;
  onSelect: (index: number) => void;
  /** Practice shows the right answer straight away; the test never does. */
  correctIndex?: number;
  explanation?: string;
  isDisabled?: boolean;
}

/**
 * One question with lettered options. Used for filling in a blank, for choosing
 * between easily confused words, and for the multiple-choice test. When
 * `correctIndex` is given the options turn green or red and the explanation shows.
 */
export function ChoiceQuestion({
  sentence,
  options,
  selected,
  onSelect,
  correctIndex,
  explanation,
  isDisabled = false,
}: ChoiceQuestionProps) {
  const isRevealed = correctIndex !== undefined && selected !== undefined;

  return (
    <div className="flex flex-col gap-4">
      <Text as="p" size="body-lg" weight="medium" className="break-words">
        {sentence}
      </Text>
      <ul
        role="radiogroup"
        aria-label="Các lựa chọn"
        className="flex flex-col gap-2"
      >
        {options.map((option, index) => {
          const isSelected = selected === index;
          const isCorrect = isRevealed && index === correctIndex;
          const isWrong = isRevealed && isSelected && index !== correctIndex;
          return (
            <li key={option}>
              <button
                type="button"
                role="radio"
                aria-checked={isSelected}
                disabled={isDisabled || isRevealed}
                onClick={() => onSelect(index)}
                className={cn(
                  "flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-standard border-2 px-3 py-2 text-left text-body-md transition-colors motion-reduce:transition-none",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-border-focus disabled:cursor-default",
                  !isRevealed &&
                    "border-border-subtle bg-surface-card hover:border-border-strong hover:bg-surface-sunken",
                  !isRevealed &&
                    isSelected &&
                    "border-border-strong bg-accent-yellow hover:bg-accent-yellow",
                  isCorrect &&
                    "border-success-text bg-success-bg text-success-text",
                  isWrong && "border-danger-text bg-danger-bg text-danger-text",
                  isRevealed &&
                    !isCorrect &&
                    !isWrong &&
                    "border-border-subtle bg-surface-card opacity-60",
                )}
              >
                <span
                  aria-hidden="true"
                  className="flex size-7 shrink-0 items-center justify-center rounded-pill border-2 border-current text-caption font-bold"
                >
                  {OPTION_LETTERS[index]}
                </span>
                <span className="min-w-0 flex-1 break-words">{option}</span>
                {isCorrect && <span aria-label="Đáp án đúng">✓</span>}
                {isWrong && <span aria-label="Bạn chọn sai">✕</span>}
              </button>
            </li>
          );
        })}
      </ul>
      {isRevealed && explanation && (
        <Alert
          variant={selected === correctIndex ? "success" : "danger"}
          title={selected === correctIndex ? "Chính xác!" : "Chưa đúng"}
        >
          {explanation}
        </Alert>
      )}
    </div>
  );
}
