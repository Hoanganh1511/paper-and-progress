import { Text, cn } from "@/design-system";
import { SECTION_LABELS } from "../display";
import type { LearnWord, VocabSection } from "../types";

export interface FlashcardProps {
  word: LearnWord;
  section: VocabSection;
  isFlipped: boolean;
  onFlip: () => void;
}

const face =
  "absolute inset-0 flex flex-col justify-center gap-3 overflow-y-auto rounded-standard border-2 border-border-strong p-6 [backface-visibility:hidden]";

/** A card that turns over: the word on the front, its meaning, example and notes on the back. */
export function Flashcard({
  word,
  section,
  isFlipped,
  onFlip,
}: FlashcardProps) {
  return (
    <div className="[perspective:1000px]">
      <button
        type="button"
        onClick={onFlip}
        aria-pressed={isFlipped}
        aria-label={
          isFlipped
            ? `Lật lại thẻ ${word.word}`
            : `Lật thẻ ${word.word} để xem nghĩa`
        }
        className={cn(
          "relative block h-80 w-full cursor-pointer text-left [transform-style:preserve-3d] sm:h-96",
          "transition-transform duration-500 ease-out motion-reduce:transition-none",
          "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-solid focus-visible:outline-border-focus",
          isFlipped && "[transform:rotateY(180deg)]",
        )}
      >
        <span
          aria-hidden={isFlipped}
          className={cn(
            face,
            "items-center bg-surface-card text-center shadow-modal",
          )}
        >
          <Text
            as="span"
            size="body-sm"
            weight="semibold"
            color="secondary"
            className="uppercase"
          >
            {SECTION_LABELS[section]}
          </Text>
          <Text
            as="span"
            weight="bold"
            className="font-display text-[clamp(2rem,6vw,3rem)] leading-tight break-words"
          >
            {word.word}
          </Text>
          {word.contrast && (
            <Text as="span" size="body-sm" color="secondary">
              Dễ nhầm: {word.contrast}
            </Text>
          )}
          <Text as="span" size="body-sm" color="muted">
            Chạm để lật thẻ
          </Text>
        </span>

        <span
          aria-hidden={!isFlipped}
          className={cn(
            face,
            "bg-accent-yellow text-ink shadow-modal [transform:rotateY(180deg)]",
          )}
        >
          <Text
            as="span"
            size="heading-sm"
            weight="bold"
            className="font-display text-ink"
          >
            {word.meaning}
          </Text>
          {word.example && (
            <Text as="span" size="body-md" className="text-ink italic">
              “{word.example}”
            </Text>
          )}
          {word.pattern && (
            <Text as="span" size="body-sm" className="text-ink">
              <strong>Cấu trúc:</strong> {word.pattern}
            </Text>
          )}
          {word.forms && (
            <Text as="span" size="body-sm" className="text-ink">
              <strong>Dạng từ:</strong> {word.forms}
            </Text>
          )}
          {word.contrast && (
            <Text as="span" size="body-sm" className="text-ink">
              <strong>Dễ nhầm với:</strong> {word.contrast}
            </Text>
          )}
        </span>
      </button>
    </div>
  );
}
