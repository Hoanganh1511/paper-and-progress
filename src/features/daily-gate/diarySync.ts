import {
  saveLog,
  toLocalDateKey,
  type DiaryLog,
} from "@/features/english-diary";
import type { LearnProgress } from "./learnProgress";
import type { LearnResponse } from "./types";

const START = "— Ghi chú từ Daily English —";
const END = "— Hết ghi chú Daily English —";

/** The id of the English Logs entry that holds a day's Daily English notes. */
export const dailyLogId = (date: string) => `daily-english-${date}`;

/** Where the entry shows up. */
export const ENGLISH_LOGS_HREF = "/goals/english/diary";

/** The note lines for the words the learner marked "review" or wrote a note on. */
export function buildNotesBlock(
  lesson: LearnResponse,
  progress: LearnProgress,
): { block: string; words: string[] } {
  const lines: string[] = [];
  const words: string[] = [];
  for (const section of lesson.sections) {
    for (const word of section.words) {
      const note = progress.notes[word.id]?.trim();
      const isReview = progress.marks[word.id] === "review";
      if (!note && !isReview) continue;
      words.push(word.word);
      lines.push(
        `• ${word.word}${isReview ? " (cần ôn)" : ""}${note ? `: ${note}` : ""}`,
      );
    }
  }
  return {
    block: lines.length ? [START, ...lines, END].join("\n") : "",
    words,
  };
}

/** Puts the block in the user's notes, replacing the old one and leaving their own text alone. */
export function mergeNotes(existing: string, block: string): string {
  const from = existing.indexOf(START);
  const to = existing.indexOf(END);
  const own =
    from !== -1 && to > from
      ? `${existing.slice(0, from)}${existing.slice(to + END.length)}`.trim()
      : existing.trim();
  return [own, block].filter(Boolean).join("\n\n");
}

/**
 * Keeps one English Logs entry per day up to date with the words learned in
 * Daily English, so the notes show up in the diary without being copied by hand.
 * Does nothing until the learner has marked or noted a word, or finished.
 */
export function syncDailyEnglishLog(options: {
  date: string;
  lesson: LearnResponse;
  progress: LearnProgress;
  isCompleted: boolean;
  existing?: DiaryLog;
}) {
  const { date, lesson, progress, isCompleted, existing } = options;
  const { block, words } = buildNotesBlock(lesson, progress);
  if (!block && !isCompleted) return;
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
    notes: mergeNotes(existing?.notes ?? "", block),
    status: isCompleted ? "completed" : (existing?.status ?? "draft"),
    isArchived: existing?.isArchived ?? false,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  });
}
