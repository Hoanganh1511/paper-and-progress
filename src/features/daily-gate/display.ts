import type {
  ActiveToday,
  GateProgress,
  LessonType,
  Phrase,
  PhraseStage,
  VocabSection,
} from "./types";

export const PASS_SCORE = 70;

export const SECTION_LABELS: Record<VocabSection, string> = {
  TOPIC_CONTRAST: "Từ dễ nhầm",
  PHRASAL_VERB: "Phrasal verbs",
  PHRASE_COLLOCATION: "Cụm từ",
  WORD_PATTERN: "Cấu trúc từ",
  WORD_FORMATION: "Cấu tạo từ",
};

export type Step = "learn" | "practice" | "test";

export const STEPS: { id: Step; label: string }[] = [
  { id: "learn", label: "Học" },
  { id: "practice", label: "Luyện tập" },
  { id: "test", label: "Kiểm tra" },
];

/** The step to do next, or "done" when the gate is already open. */
export function nextStep(progress: GateProgress): Step | "done" {
  if (progress.gateUnlocked) return "done";
  if (!progress.learnCompleted) return "learn";
  if (!progress.practiceCompleted) return "practice";
  return "test";
}

export const LESSON_TYPE_LABELS: Record<LessonType, string> = {
  NEW: "Bài mới",
  REVIEW: "Ngày ôn tập",
  FINAL_TEST: "Kiểm tra cuối",
};

/** "Travel and transport", or "Travel and transport, Hobbies, sport and games" on a review day. */
export const topicOf = (today: ActiveToday) =>
  today.type === "FINAL_TEST"
    ? "Tổng ôn và kiểm tra cuối"
    : today.units.map((unit) => unit.topic).join(", ");

/** 299 -> "4:59" */
export function formatClock(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"];

export const PHRASE_STAGE_LABELS: Record<PhraseStage, string> = {
  WRITE: "Chưa đặt câu",
  RECALL: "Cần nhớ lại",
  SPEAK: "Cần luyện nói",
  MASTERED: "Đã thuộc",
};

/** Steps of the method done so far (1 = learned, 4 = all four). */
export const PHRASE_STEPS_DONE: Record<PhraseStage, number> = {
  WRITE: 1,
  RECALL: 2,
  SPEAK: 3,
  MASTERED: 4,
};

/** True for a phrase typed as one word, which is better learned with its partners. */
export const isSingleWord = (phrase: string) =>
  phrase.trim().split(/\s+/).filter(Boolean).length === 1;

/** "2026-11-06" -> "06/11" */
export const formatShortDate = (date: string) =>
  `${date.slice(8, 10)}/${date.slice(5, 7)}`;

/** Phrases in the order of the notebook: those to review first, then by date. */
export const sortPhrases = (phrases: Phrase[]) =>
  [...phrases].sort(
    (a, b) =>
      a.nextReviewAt.localeCompare(b.nextReviewAt) ||
      a.createdAt.localeCompare(b.createdAt),
  );
