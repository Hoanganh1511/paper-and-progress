import { Check, Target } from "lucide-react";
import { Badge, Text, cn } from "@/design-system";
import { Ticks } from "@/features/decor";
import { SECTION_LABELS } from "../display";
import type { LearnWord, VocabSection } from "../types";

export interface FlashcardProps {
  word: LearnWord;
  section: VocabSection;
  isFlipped: boolean;
  onFlip: () => void;
  /** The word is learned (known, or all its sentences written): the front is dressed for it. */
  isLearned?: boolean;
}

const face =
  "absolute inset-0 flex flex-col justify-center gap-3 overflow-y-auto rounded-standard border-2 border-border-strong p-6 [backface-visibility:hidden]";

/** The front of a word still to learn: plain, on a white card. */
function PlainFront({
  word,
  section,
}: {
  word: LearnWord;
  section: VocabSection;
}) {
  return (
    <>
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
    </>
  );
}

/**
 * The front of a learned word: a pale lime card with a "Đã học" tag, the word on
 * a highlighter stroke, a green hill along the bottom and the panda at its
 * laptop (which has its own tick bubble). The look is a reward and a mark, and the words "Đã học"
 * say the same, so it never relies on colour.
 */
function LearnedFront({
  word,
  section,
}: {
  word: LearnWord;
  section: VocabSection;
}) {
  return (
    <>
      {/* Behind the text: the hill and the panda do not take clicks or reading. */}
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 400 120"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 w-full"
      >
        <path
          d="M0 70 C70 25 150 25 230 55 C300 80 350 60 400 35 L400 120 L0 120 Z"
          fill="var(--color-accent-lime)"
          opacity="0.35"
        />
      </svg>
      {/* The panda, with its own tick bubble and sparks, at the corner. A picture only: the words say it. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/mascot/panda-laptop-done.webp"
        alt=""
        width={640}
        height={427}
        className="pointer-events-none absolute right-1 bottom-0 hidden h-auto w-40 sm:block sm:w-52"
      />

      <span className="absolute top-4 left-4 flex items-start gap-1">
        <Badge variant="lime" icon={Check} className="font-bold">
          Đã học
        </Badge>
        <Ticks corner="top-left" className="h-6 w-6" />
      </span>

      <span className="relative flex flex-col items-center gap-3">
        <Text
          as="span"
          size="body-sm"
          weight="semibold"
          className="rounded-pill bg-accent-lime/40 px-4 py-1 text-ink uppercase"
        >
          {SECTION_LABELS[section]}
        </Text>
        <span className="relative inline-block px-3">
          {/* The highlighter stroke under the lower half of the word. */}
          <span
            aria-hidden="true"
            className="absolute inset-x-0 bottom-1 h-[45%] -rotate-1 rounded-pill bg-accent-lime"
          />
          <Text
            as="span"
            weight="bold"
            className="relative font-display text-[clamp(2rem,6vw,3.25rem)] leading-tight break-words text-ink"
          >
            {word.word}
          </Text>
        </span>
        {word.contrast && (
          <span className="inline-flex max-w-full items-center gap-2 rounded-pill border-2 border-border-subtle bg-surface-card/70 px-5 py-2">
            <Target aria-hidden="true" size={18} className="shrink-0" />
            <Text as="span" size="body-md" className="break-words">
              Dễ nhầm: <strong>{word.contrast}</strong>
            </Text>
          </span>
        )}
        <span className="mt-1 flex w-56 flex-col items-center gap-2 border-t-2 border-border-subtle pt-3">
          <Text
            as="span"
            size="body-sm"
            color="secondary"
            className="inline-flex items-center gap-1.5 italic"
          >
            <Check aria-hidden="true" size={14} />
            Đã học và ghi nhớ từ này
          </Text>
          <Text as="span" size="body-sm" color="muted">
            Chạm để lật thẻ
          </Text>
        </span>
      </span>
    </>
  );
}

/** A card that turns over: the word on the front, its meaning, example and notes on the back. */
export function Flashcard({
  word,
  section,
  isFlipped,
  onFlip,
  isLearned = false,
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
            "items-center text-center shadow-modal",
            isLearned ? "overflow-hidden bg-accent-lime/15" : "bg-surface-card",
          )}
        >
          {isLearned ? (
            <LearnedFront word={word} section={section} />
          ) : (
            <PlainFront word={word} section={section} />
          )}
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
