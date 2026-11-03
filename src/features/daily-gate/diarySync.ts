import {
  saveLog,
  toLocalDateKey,
  type DailyEnglishNotes,
  type DiaryLog,
  type LoggedWord,
} from "@/features/english-diary";
import { ENTRY_COPY, HELP_KINDS } from "./entryCopy";
import type { LearnProgress } from "./learnProgress";
import type { LearnResponse, WordEntry } from "./types";

const START = "— Ghi chú từ Daily English —";
const END = "— Hết ghi chú Daily English —";

/** The id of the English Logs entry that holds a day's Daily English notes. */
export const dailyLogId = (date: string) => `daily-english-${date}`;

/** Where the entry shows up. */
export const ENGLISH_LOGS_HREF = "/goals/english/diary";

/**
 * What to keep in English Logs for the day: the words the learner marked
 * "review", wrote a note on, or practised, each with its sentences,
 * collocations and related words. Words known already are only counted.
 */
export function buildDailyEnglish(
  lesson: LearnResponse,
  progress: LearnProgress,
  /** What the learner wrote, by word id, and how many sentences make a word learned. */
  written?: { entries: Record<number, WordEntry[]>; required: number },
): {
  data: DailyEnglishNotes;
  words: string[];
  learned: number;
  total: number;
} {
  const logged: LoggedWord[] = [];
  let learned = 0;
  let total = 0;
  for (const section of lesson.sections) {
    for (const word of section.words) {
      total += 1;
      const note = progress.notes[word.id]?.trim();
      const isReview = progress.marks[word.id] === "review";
      const isKnown = progress.marks[word.id] === "known";
      const entries = written?.entries[word.id] ?? [];
      const textsOf = (kind: WordEntry["kind"]) =>
        entries.filter((entry) => entry.kind === kind).map((e) => e.text);
      const sentences = textsOf("SENTENCE");
      const isLearned =
        written !== undefined &&
        written.required > 0 &&
        (isKnown || sentences.length >= written.required);
      if (isLearned) learned += 1;
      // A word known already is counted, but not listed.
      if (!note && !isReview && entries.length === 0) continue;
      // Collocations and related words have a place of their own; the rest keep their name.
      const others = HELP_KINDS.filter(
        (kind) => kind !== "COLLOCATION" && kind !== "RELATED",
      ).flatMap((kind) => {
        const items = textsOf(kind);
        return items.length > 0
          ? [{ label: ENTRY_COPY[kind].title, items }]
          : [];
      });
      logged.push({
        word: word.word,
        isLearned,
        isKnown,
        isReview,
        ...(note ? { note } : {}),
        sentences,
        collocations: textsOf("COLLOCATION"),
        related: textsOf("RELATED"),
        ...(others.length > 0 ? { others } : {}),
      });
    }
  }
  const hasCount = written !== undefined && written.required > 0;
  return {
    data: {
      ...(hasCount ? { learned, total } : {}),
      words: logged,
    },
    words: logged.map((item) => item.word),
    learned,
    total,
  };
}

/**
 * The user's own notes without the block older versions wrote into them (the
 * words are data of the log now), keeping everything they typed themselves.
 */
export function withoutGeneratedNotes(existing: string): string {
  const from = existing.indexOf(START);
  const to = existing.indexOf(END);
  return from !== -1 && to > from
    ? `${existing.slice(0, from)}${existing.slice(to + END.length)}`.trim()
    : existing.trim();
}

/**
 * Keeps one English Logs entry per day up to date with the words learned in
 * Daily English, so the notes show up in the diary without being copied by hand.
 * Does nothing until the learner has marked, noted or practised a word, or finished.
 */
export function syncDailyEnglishLog(options: {
  date: string;
  lesson: LearnResponse;
  progress: LearnProgress;
  isCompleted: boolean;
  existing?: DiaryLog;
  entries?: Record<number, WordEntry[]>;
  /** Sentences that make a word learned; 0 or missing when sentences are not required. */
  required?: number;
}) {
  const { date, lesson, progress, isCompleted, existing } = options;
  const { data, words } = buildDailyEnglish(
    lesson,
    progress,
    options.entries && options.required
      ? { entries: options.entries, required: options.required }
      : undefined,
  );
  if (words.length === 0 && !isCompleted) return;
  const vocabulary = [...new Set([...(existing?.vocabulary ?? []), ...words])];
  saveLog({
    id: dailyLogId(date),
    title: `Daily English – ${lesson.unitTopic}`,
    skill: "vocabulary",
    date: date || toLocalDateKey(),
    durationMinutes: existing?.durationMinutes,
    goal: existing?.goal || "Học từ vựng mỗi ngày",
    content: existing?.content ?? "",
    vocabulary,
    resources: existing?.resources ?? [],
    tags: [...new Set([...(existing?.tags ?? []), "daily-english"])],
    notes: withoutGeneratedNotes(existing?.notes ?? ""),
    dailyEnglish: data,
    status: isCompleted ? "completed" : (existing?.status ?? "draft"),
    isArchived: existing?.isArchived ?? false,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  });
}
