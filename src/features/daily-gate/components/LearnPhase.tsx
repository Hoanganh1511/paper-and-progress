"use client";

import { useEffect, useState, type TouchEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookPlus,
  Check,
  RotateCw,
} from "lucide-react";
import { Alert, Button, ProgressBar, Text, cn } from "@/design-system";
import { SECTION_LABELS } from "../display";
import type { LearnResponse, LearnWord, VocabSection } from "../types";
import { Flashcard } from "./Flashcard";
import { PhraseForm, type PhraseFormValues } from "./PhraseForm";

const SWIPE_DISTANCE = 50;

export interface LearnPhaseProps {
  lesson: LearnResponse;
  /** Called once every card has been seen; resolves to an error message, or undefined. */
  onComplete: () => Promise<string | undefined>;
  onBack: () => void;
  /** Lesson words already in the phrase notebook. */
  savedWordIds?: ReadonlySet<number>;
  /** Saves a phrase to the notebook; resolves to an error message, or undefined. Without it there is no save button. */
  onSavePhrase?: (
    word: LearnWord,
    values: PhraseFormValues,
  ) => Promise<string | undefined>;
}

/** Sections whose words are phrases worth keeping in the notebook. */
const PHRASE_SECTIONS: readonly VocabSection[] = [
  "PHRASE_COLLOCATION",
  "PHRASAL_VERB",
];

type Mark = "known" | "review";

/** Flashcards for the day's words, one section per tab. */
export function LearnPhase({
  lesson,
  onComplete,
  onBack,
  savedWordIds,
  onSavePhrase,
}: LearnPhaseProps) {
  const cards = lesson.sections.flatMap((section) =>
    section.words.map((word) => ({ word, section: section.type })),
  );
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [visited, setVisited] = useState<ReadonlySet<number>>(new Set([0]));
  const [marks, setMarks] = useState<Record<number, Mark>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [touchStart, setTouchStart] = useState<number>();
  const [justSaved, setJustSaved] = useState<ReadonlySet<number>>(new Set());
  const [isSaveFormOpen, setIsSaveFormOpen] = useState(false);

  const current = cards[index];
  const hasSeenAll = visited.size === cards.length;

  function go(next: number) {
    if (next < 0 || next >= cards.length) return;
    setIndex(next);
    setIsFlipped(false);
    setIsSaveFormOpen(false);
    setVisited((previous) => new Set(previous).add(next));
  }

  // Arrow keys turn the cards from anywhere on the page, not only from a focused button.
  useEffect(() => {
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      // Arrow keys move the caret while typing in the save form.
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
      ) {
        return;
      }
      if (event.key === "ArrowRight") go(index + 1);
      else if (event.key === "ArrowLeft") go(index - 1);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  function mark(word: LearnWord, value: Mark) {
    setMarks(
      (previous) =>
        ({
          ...previous,
          [word.id]: previous[word.id] === value ? undefined : value,
        }) as Record<number, Mark>,
    );
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    if (touchStart === undefined) return;
    const distance = event.changedTouches[0].clientX - touchStart;
    setTouchStart(undefined);
    if (distance <= -SWIPE_DISTANCE) go(index + 1);
    else if (distance >= SWIPE_DISTANCE) go(index - 1);
  }

  async function complete() {
    setIsSaving(true);
    setError(undefined);
    const message = await onComplete();
    if (message) {
      setError(message);
      setIsSaving(false);
    }
  }

  if (cards.length === 0 || !current) {
    return (
      <Alert variant="warning" title="Chưa có từ để học">
        <Button variant="outline" onClick={onBack}>
          Quay lại
        </Button>
      </Alert>
    );
  }

  const canSave =
    onSavePhrase !== undefined && PHRASE_SECTIONS.includes(current.section);
  const isSaved =
    savedWordIds?.has(current.word.id) === true ||
    justSaved.has(current.word.id);

  async function savePhrase(values: PhraseFormValues) {
    const message = await onSavePhrase?.(current.word, values);
    if (!message) {
      setJustSaved((previous) => new Set(previous).add(current.word.id));
      setIsSaveFormOpen(false);
    }
    return message;
  }

  const firstOf = (section: VocabSection) =>
    cards.findIndex((card) => card.section === section);

  return (
    <div
      className="flex flex-col gap-5"
      onTouchStart={(event) => setTouchStart(event.touches[0].clientX)}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Text as="h2" size="heading-md" weight="bold" className="font-display">
          {lesson.unitTopic}
        </Text>
        <Text size="body-md" weight="semibold" aria-live="polite">
          Thẻ {index + 1} / {cards.length}
        </Text>
      </div>

      <ProgressBar value={(visited.size / cards.length) * 100} label="Đã xem" />

      <div role="group" aria-label="Nhóm từ" className="flex flex-wrap gap-2">
        {lesson.sections.map((section) => (
          <Button
            key={section.type}
            size="compact"
            variant={current.section === section.type ? "primary" : "outline"}
            aria-pressed={current.section === section.type}
            onClick={() => go(firstOf(section.type))}
          >
            {SECTION_LABELS[section.type]} ({section.words.length})
          </Button>
        ))}
      </div>

      <Flashcard
        word={current.word}
        section={current.section}
        isFlipped={isFlipped}
        onFlip={() => setIsFlipped((flipped) => !flipped)}
      />

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button
          variant={marks[current.word.id] === "known" ? "accent" : "outline"}
          size="compact"
          leftIcon={Check}
          aria-pressed={marks[current.word.id] === "known"}
          onClick={() => mark(current.word, "known")}
        >
          Đã biết
        </Button>
        <Button
          variant={marks[current.word.id] === "review" ? "accent" : "outline"}
          size="compact"
          leftIcon={Bookmark}
          aria-pressed={marks[current.word.id] === "review"}
          onClick={() => mark(current.word, "review")}
        >
          Cần ôn lại
        </Button>
      </div>

      {canSave && (
        <div className="flex flex-col items-center gap-3">
          {isSaved ? (
            <Button variant="outline" size="compact" leftIcon={Check} disabled>
              Đã lưu
            </Button>
          ) : (
            <Button
              variant="outline"
              size="compact"
              leftIcon={BookPlus}
              aria-expanded={isSaveFormOpen}
              onClick={() => setIsSaveFormOpen((isOpen) => !isOpen)}
            >
              Lưu vào sổ
            </Button>
          )}
          {isSaveFormOpen && !isSaved && (
            <div className="w-full">
              <PhraseForm
                key={current.word.id}
                initial={{
                  phrase: current.word.word,
                  sampleSentence: current.word.example ?? "",
                }}
                referenceMeaning={current.word.meaning}
                submitLabel="Lưu vào sổ"
                onSubmit={savePhrase}
                onCancel={() => setIsSaveFormOpen(false)}
              />
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          leftIcon={ArrowLeft}
          disabled={index === 0}
          onClick={() => go(index - 1)}
        >
          Trước
        </Button>
        <Button
          variant="ghost"
          leftIcon={RotateCw}
          onClick={() => setIsFlipped((flipped) => !flipped)}
        >
          Lật thẻ
        </Button>
        <Button
          variant="outline"
          rightIcon={ArrowRight}
          disabled={index === cards.length - 1}
          onClick={() => go(index + 1)}
        >
          Sau
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <div
        className={cn(
          "flex flex-col items-center gap-2",
          !hasSeenAll && "opacity-90",
        )}
      >
        <Button
          size="comfortable"
          variant="accent"
          isLoading={isSaving}
          disabled={!hasSeenAll}
          onClick={complete}
        >
          Hoàn thành phần học
        </Button>
        {!hasSeenAll && (
          <Text size="body-sm" color="secondary">
            Xem hết {cards.length} thẻ để tiếp tục (
            {cards.length - visited.size} thẻ nữa).
          </Text>
        )}
      </div>
    </div>
  );
}
