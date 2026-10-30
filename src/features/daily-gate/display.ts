import type {
  ActiveToday,
  GateProgress,
  LessonType,
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
