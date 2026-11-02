export type Mark = "known" | "review";

/** Where the learner is in a lesson's flashcards, kept so closing the modal loses nothing. */
export interface LearnProgress {
  index: number;
  visited: number[];
  marks: Record<number, Mark>;
  /** The learner's own note for a word, by word id. */
  notes: Record<number, string>;
}

const keyOf = (lessonId: number) => `pp.daily-gate.learn.${lessonId}`;

export const emptyProgress = (): LearnProgress => ({
  index: 0,
  visited: [0],
  marks: {},
  notes: {},
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** What was saved for this lesson in this browser, or an empty start. */
export function loadLearnProgress(lessonId: number): LearnProgress {
  try {
    const parsed: unknown = JSON.parse(
      localStorage.getItem(keyOf(lessonId)) ?? "null",
    );
    if (!isRecord(parsed)) return emptyProgress();
    const marks: Record<number, Mark> = {};
    if (isRecord(parsed.marks)) {
      for (const [id, mark] of Object.entries(parsed.marks)) {
        if (mark === "known" || mark === "review") marks[Number(id)] = mark;
      }
    }
    const notes: Record<number, string> = {};
    if (isRecord(parsed.notes)) {
      for (const [id, note] of Object.entries(parsed.notes)) {
        if (typeof note === "string" && note.trim()) notes[Number(id)] = note;
      }
    }
    return {
      index:
        typeof parsed.index === "number" && parsed.index >= 0
          ? Math.floor(parsed.index)
          : 0,
      visited: Array.isArray(parsed.visited)
        ? parsed.visited.filter((n): n is number => typeof n === "number")
        : [0],
      marks,
      notes,
    };
  } catch {
    return emptyProgress();
  }
}

export function saveLearnProgress(lessonId: number, progress: LearnProgress) {
  try {
    localStorage.setItem(keyOf(lessonId), JSON.stringify(progress));
  } catch {
    // Storage blocked: progress lasts only until the page is closed.
  }
}
