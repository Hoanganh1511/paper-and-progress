"use client";

import Link from "next/link";
import { useEffect, useState, type TouchEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookPlus,
  Check,
  Circle,
  SkipForward,
  RotateCw,
} from "lucide-react";
import {
  Alert,
  Button,
  FormField,
  ProgressBar,
  Text,
  Textarea,
  cn,
} from "@/design-system";
import { useDiaryLogs } from "@/features/english-diary";
import {
  ENGLISH_LOGS_HREF,
  dailyLogId,
  syncDailyEnglishLog,
} from "../diarySync";
import {
  loadLearnProgress,
  saveLearnProgress,
  type Mark,
} from "../learnProgress";
import { SECTION_LABELS } from "../display";
import type {
  LearnResponse,
  LearnWord,
  VocabSection,
  EntryKind,
  WordEntry,
} from "../types";
import { Flashcard } from "./Flashcard";
import { PhraseForm, type PhraseFormValues } from "./PhraseForm";
import { MoreWays } from "./MoreWays";
import { WordEntryList } from "./WordEntryList";
import { WordKnowledge } from "./WordKnowledge";

const SWIPE_DISTANCE = 50;

/** Which words the cards show: every one, the ones still to learn, or the ones learned. */
type WordFilter = "all" | "todo" | "done";
const FILTER_LABELS: Record<WordFilter, string> = {
  all: "Tất cả",
  todo: "Chưa học",
  done: "Đã học",
};

export interface LearnPhaseProps {
  lesson: LearnResponse;
  /** Keeps cards, marks and notes in this browser, and copies the notes to English Logs on `date`. */
  save?: { lessonId: number; date: string };
  /** Called once every word is learned; resolves to an error message, or undefined. */
  onComplete: () => Promise<string | undefined>;
  onBack: () => void;
  /** Lesson words already in the phrase notebook. */
  savedWordIds?: ReadonlySet<number>;
  /** Saves a phrase to the notebook; resolves to an error message, or undefined. Without it there is no save button. */
  onSavePhrase?: (
    word: LearnWord,
    values: PhraseFormValues,
  ) => Promise<string | undefined>;
  /**
   * Saves a sentence, a collocation or a related word for a word on the server;
   * resolves to all the word's entries, or an error. Without it there is no
   * sentence requirement.
   */
  onAddEntry?: (
    word: LearnWord,
    kind: EntryKind,
    text: string,
  ) => Promise<{ entries: WordEntry[] } | { error: string }>;
  onRemoveEntry?: (entry: WordEntry) => Promise<string | undefined>;
  /** Saves "Đã biết" / "Cần ôn lại" on the server (`null` takes it off); resolves to an error message, or undefined. */
  onMark?: (word: LearnWord, mark: Mark | null) => Promise<string | undefined>;
}

/** Sections whose words are phrases worth keeping in the notebook. */
const PHRASE_SECTIONS: readonly VocabSection[] = [
  "PHRASE_COLLOCATION",
  "PHRASAL_VERB",
];

/** Flashcards for the day's words, one section per tab. */
export function LearnPhase({
  lesson,
  save,
  onComplete,
  onBack,
  savedWordIds,
  onSavePhrase,
  onAddEntry,
  onRemoveEntry,
  onMark,
}: LearnPhaseProps) {
  const cards = lesson.sections.flatMap((section) =>
    section.words.map((word) => ({ word, section: section.type })),
  );
  // Read once on mount: the modal comes back where the learner left it.
  const [restored] = useState(() =>
    save ? loadLearnProgress(save.lessonId) : undefined,
  );
  const [index, setIndex] = useState(() =>
    Math.min(restored?.index ?? 0, Math.max(cards.length - 1, 0)),
  );
  const [isFlipped, setIsFlipped] = useState(false);
  const [visited, setVisited] = useState<ReadonlySet<number>>(
    () => new Set(restored?.visited ?? [0]),
  );
  // With a server the marks come from it; without one they stay in this browser.
  const [marks, setMarks] = useState<Record<number, Mark>>(() =>
    onMark ? (lesson.marks ?? {}) : (restored?.marks ?? {}),
  );
  const [notes, setNotes] = useState<Record<number, string>>(
    restored?.notes ?? {},
  );
  // What was written lives on the server; this is its copy, so a reload keeps every word's count.
  const required = onAddEntry ? (lesson.sentencesPerWord ?? 5) : 0;
  const [entries, setEntries] = useState<Record<number, WordEntry[]>>(
    () => lesson.entries ?? {},
  );
  const entriesOf = (wordId: number, kind: EntryKind) =>
    (entries[wordId] ?? []).filter((entry) => entry.kind === kind);
  // A word is learned when the learner knows it, or has written all its sentences.
  // Turning the cards over proves nothing.
  const isLearned = (wordId: number) =>
    required === 0 ||
    marks[wordId] === "known" ||
    entriesOf(wordId, "SENTENCE").length >= required;
  const learnedCount = cards.filter(({ word }) => isLearned(word.id)).length;
  const logs = useDiaryLogs();
  const existingLog = save
    ? logs.find((log) => log.id === dailyLogId(save.date))
    : undefined;
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [touchStart, setTouchStart] = useState<number>();
  const [justSaved, setJustSaved] = useState<ReadonlySet<number>>(new Set());
  const [isSaveFormOpen, setIsSaveFormOpen] = useState(false);
  const [filter, setFilter] = useState<WordFilter>("all");

  const current = cards[index];

  const lessonId = save?.lessonId;
  const date = save?.date;
  useEffect(() => {
    if (lessonId === undefined || date === undefined) return;
    const progress = { index, visited: [...visited], marks, notes };
    saveLearnProgress(lessonId, progress);
    // English Logs gets the notes as they are written, not only at the end.
    syncDailyEnglishLog({
      date,
      lesson,
      progress,
      isCompleted: false,
      existing: existingLog,
      entries,
      required,
    });
    // existingLog is read, not watched: saving the log must not save it again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId, date, index, visited, marks, notes, entries]);
  const canComplete = learnedCount === cards.length;

  // The cards in view: all of them, or only the words still to learn / already learned.
  // A card that stops matching (the word was just marked known) stays until the learner moves on.
  const matches = (cardIndex: number, which: WordFilter) =>
    which === "all" ||
    isLearned(cards[cardIndex].word.id) === (which === "done");
  const visible = cards.flatMap((_, i) => (matches(i, filter) ? [i] : []));
  const countOf = (which: WordFilter) =>
    cards.filter((_, i) => matches(i, which)).length;
  /** The nearest card in view before (-1) or after (1) the one shown. */
  const neighbour = (direction: 1 | -1) => {
    for (
      let i = index + direction;
      i >= 0 && i < cards.length;
      i += direction
    ) {
      if (visible.includes(i)) return i;
    }
    return undefined;
  };
  const previousIndex = neighbour(-1);
  const nextIndex = neighbour(1);
  /** The next word still to learn after this one, starting over from the top at the end. */
  const nextToLearn = (() => {
    for (let step = 1; step < cards.length; step += 1) {
      const i = (index + step) % cards.length;
      if (!isLearned(cards[i].word.id)) return i;
    }
    return undefined;
  })();

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
      if (event.key === "ArrowRight" && nextIndex !== undefined) go(nextIndex);
      else if (event.key === "ArrowLeft" && previousIndex !== undefined)
        go(previousIndex);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  function chooseFilter(next: WordFilter) {
    setFilter(next);
    const fits = cards.flatMap((_, i) => (matches(i, next) ? [i] : []));
    // The card shown may not fit the new filter: go to the nearest one that does.
    if (fits.length > 0 && !fits.includes(index)) {
      go(fits.find((i) => i > index) ?? fits[0]);
    }
  }

  /** Saves an entry of the word shown and keeps the server's list of that word. */
  async function addEntry(kind: EntryKind, text: string) {
    if (!onAddEntry) return undefined;
    const result = await onAddEntry(current.word, kind, text);
    if ("error" in result) return result.error;
    const id = current.word.id;
    setEntries((previous) => ({ ...previous, [id]: result.entries }));
    return undefined;
  }

  async function removeEntry(entry: WordEntry) {
    const message = await onRemoveEntry?.(entry);
    if (message) return message;
    const id = current.word.id;
    setEntries((previous) => ({
      ...previous,
      [id]: (previous[id] ?? []).filter((item) => item.id !== entry.id),
    }));
    return undefined;
  }

  async function mark(word: LearnWord, value: Mark) {
    const before = marks[word.id];
    const next = before === value ? undefined : value;
    const set = (mark: Mark | undefined) =>
      setMarks(
        (previous) =>
          ({ ...previous, [word.id]: mark }) as Record<number, Mark>,
      );
    set(next);
    const message = await onMark?.(word, next ?? null);
    if (message) {
      // The server did not take it, so the button goes back.
      set(before);
      setError(message);
    }
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    if (touchStart === undefined) return;
    const distance = event.changedTouches[0].clientX - touchStart;
    setTouchStart(undefined);
    if (distance <= -SWIPE_DISTANCE && nextIndex !== undefined) go(nextIndex);
    else if (distance >= SWIPE_DISTANCE && previousIndex !== undefined)
      go(previousIndex);
  }

  async function complete() {
    setIsSaving(true);
    setError(undefined);
    const message = await onComplete();
    if (!message && save) {
      syncDailyEnglishLog({
        date: save.date,
        lesson,
        progress: { index, visited: [...visited], marks, notes },
        isCompleted: true,
        existing: existingLog,
        entries,
        required,
      });
    }
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

  const inSection = (section: VocabSection) =>
    visible.filter((i) => cards[i].section === section);

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

      {required > 0 && (
        <ProgressBar
          value={(learnedCount / cards.length) * 100}
          label={`Đã học: ${learnedCount} / ${cards.length} từ (đủ ${required} câu hoặc đã biết)`}
        />
      )}

      {required > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div
              role="group"
              aria-label="Lọc từ theo việc đã học"
              className="flex flex-wrap gap-2"
            >
              {(["all", "todo", "done"] as const).map((which) => (
                <Button
                  key={which}
                  size="compact"
                  variant={filter === which ? "primary" : "outline"}
                  aria-pressed={filter === which}
                  onClick={() => chooseFilter(which)}
                >
                  {FILTER_LABELS[which]} ({countOf(which)})
                </Button>
              ))}
            </div>
            {nextToLearn !== undefined && (
              <Button
                size="compact"
                variant="accent"
                leftIcon={SkipForward}
                onClick={() => go(nextToLearn)}
              >
                Tới từ chưa học tiếp theo
              </Button>
            )}
          </div>

          {visible.length === 0 && (
            <Alert variant={filter === "todo" ? "success" : "info"}>
              {filter === "todo"
                ? "Bạn đã học hết các từ! Bấm “Hoàn thành phần học” để tiếp tục."
                : "Chưa có từ nào ở mục này."}
            </Alert>
          )}
          {filter !== "all" && visible.length > 0 && (
            <Text size="body-sm" color="secondary" role="status">
              Đang lọc “{FILTER_LABELS[filter]}”: {visible.length} từ. Nút Trước
              và Sau chỉ đi qua các từ này.
            </Text>
          )}

          <details className="rounded-standard border-2 border-border-strong bg-surface-card p-3">
            <summary className="min-h-11 cursor-pointer font-semibold">
              Danh sách từ ({visible.length})
            </summary>
            <ul className="mt-3 flex flex-wrap gap-2">
              {visible.map((i) => {
                const learned = isLearned(cards[i].word.id);
                const isCurrent = i === index;
                return (
                  <li key={cards[i].word.id}>
                    {/*
                      Four looks, and none relies on colour alone:
                      to learn: cream and an empty circle; learned: lime, bold, and a check;
                      the word shown: black and pressed in, and it keeps its circle or check
                      (the check turns lime on the black), so it is plain whether it is learned too.
                    */}
                    <Button
                      size="compact"
                      variant={
                        isCurrent ? "primary" : learned ? "accent" : "outline"
                      }
                      aria-current={isCurrent ? "true" : undefined}
                      aria-label={`${cards[i].word.word}, ${learned ? "đã học" : "chưa học"}`}
                      className={cn(
                        learned && "font-bold",
                        isCurrent &&
                          "translate-x-0.5 translate-y-0.5 shadow-none",
                      )}
                      onClick={() => go(i)}
                    >
                      {learned ? (
                        <Check
                          aria-hidden="true"
                          size={16}
                          strokeWidth={3}
                          className={cn(
                            "shrink-0",
                            isCurrent && "text-accent-lime",
                          )}
                        />
                      ) : (
                        <Circle
                          aria-hidden="true"
                          size={16}
                          className="shrink-0"
                        />
                      )}
                      {cards[i].word.word}
                    </Button>
                  </li>
                );
              })}
            </ul>
          </details>
        </div>
      )}

      <div role="group" aria-label="Nhóm từ" className="flex flex-wrap gap-2">
        {lesson.sections.map((section) => (
          <Button
            key={section.type}
            size="compact"
            variant={current.section === section.type ? "primary" : "outline"}
            aria-pressed={current.section === section.type}
            disabled={inSection(section.type).length === 0}
            onClick={() => go(inSection(section.type)[0])}
          >
            {SECTION_LABELS[section.type]} ({inSection(section.type).length})
          </Button>
        ))}
      </div>

      <Flashcard
        word={current.word}
        section={current.section}
        isFlipped={isFlipped}
        isLearned={required > 0 && isLearned(current.word.id)}
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

      {/* Under the card: what kind of word it is and everything written for it. */}
      <WordKnowledge key={current.word.id} word={current.word} />

      {onAddEntry && (
        <div className="flex flex-col gap-3">
          <WordEntryList
            key={`${current.word.id}-SENTENCE`}
            kind="SENTENCE"
            word={current.word.word}
            required={required}
            entries={entriesOf(current.word.id, "SENTENCE")}
            onAdd={(text) => addEntry("SENTENCE", text)}
            onRemove={removeEntry}
          />
          <MoreWays
            key={`${current.word.id}-more`}
            word={current.word.word}
            entries={entries[current.word.id] ?? []}
            onAdd={addEntry}
            onRemove={removeEntry}
          />
        </div>
      )}

      {save && (
        <FormField
          label="Ghi chú cho từ này"
          description="Tự lưu, và được chép sang English Logs."
        >
          <Textarea
            key={current.word.id}
            rows={2}
            value={notes[current.word.id] ?? ""}
            placeholder="Cách nhớ, ví dụ của riêng bạn…"
            onChange={(event) => {
              const value = event.target.value;
              const id = current.word.id;
              setNotes((previous) => ({ ...previous, [id]: value }));
            }}
          />
        </FormField>
      )}
      {save && existingLog && (
        <Link
          href={ENGLISH_LOGS_HREF}
          className="self-center text-body-sm font-semibold text-text-primary underline underline-offset-4"
        >
          Xem trong English Logs
        </Link>
      )}

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
          disabled={previousIndex === undefined}
          onClick={() => previousIndex !== undefined && go(previousIndex)}
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
          disabled={nextIndex === undefined}
          onClick={() => nextIndex !== undefined && go(nextIndex)}
        >
          Sau
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <div
        className={cn(
          "flex flex-col items-center gap-2",
          !canComplete && "opacity-90",
        )}
      >
        <Button
          size="comfortable"
          variant="accent"
          isLoading={isSaving}
          disabled={!canComplete}
          onClick={complete}
        >
          Hoàn thành phần học
        </Button>
        {learnedCount < cards.length && (
          <Text size="body-sm" color="secondary">
            Còn {cards.length - learnedCount} từ chưa học: đặt đủ {required} câu
            hoặc bấm “Đã biết”.
          </Text>
        )}
      </div>
    </div>
  );
}
