import type {
  LearningLog,
  LearningLogDraft,
  LearningLogFormErrors,
  LearningLogFormValues,
  LearningLogStatus,
  LearningSkillId,
} from "./types";

export const SKILL_LABELS: Record<LearningSkillId, string> = {
  programming: "Lập trình",
  english: "Tiếng Anh",
  design: "Thiết kế",
  reading: "Đọc & Nghiên cứu",
  other: "Khác",
};

export const SKILL_IDS = Object.keys(SKILL_LABELS) as LearningSkillId[];

export const STATUS_LABELS: Record<LearningLogStatus, string> = {
  completed: "Hoàn thành",
  in_progress: "Đang học",
  not_completed: "Chưa hoàn thành",
};

export const STATUS_IDS = Object.keys(STATUS_LABELS) as LearningLogStatus[];

export const DURATION_OPTIONS = [5, 10, 15, 20, 30, 45, 60, 90, 120];

export const LIMITS = {
  titleMin: 3,
  titleMax: 120,
  goalMax: 180,
  notesMax: 5000,
  tagMax: 10,
  tagLength: 30,
} as const;

/** Today as a local YYYY-MM-DD (toISOString would shift the day by timezone). */
export function toLocalDateKey(date: Date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** "2026-10-28" -> "28/10/2026". */
export function formatLogDate(date: string): string {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

export function formatDuration(minutes?: number): string | undefined {
  return minutes ? `${minutes} phút` : undefined;
}

export function createInitialValues(
  today: string = toLocalDateKey(),
): LearningLogFormValues {
  return {
    title: "",
    skillId: "",
    duration: "30",
    learningDate: today,
    goal: "",
    notes: "",
    tags: [],
    referenceUrl: "",
    status: "completed",
  };
}

/* -------------------------------------------------------------------------- */
/* Tags and URLs                                                              */
/* -------------------------------------------------------------------------- */

/** "  #React  " -> "React"; empty when nothing is left. */
export function normalizeTag(raw: string): string {
  return raw
    .trim()
    .replace(/^#+/, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, LIMITS.tagLength);
}

export type AddTagResult =
  | { ok: true; tags: string[] }
  | { ok: false; reason: "empty" | "duplicate" | "limit"; tags: string[] };

/** Adds a tag unless it is empty, already there (ignoring case) or the list is full. */
export function addTag(tags: string[], raw: string): AddTagResult {
  const tag = normalizeTag(raw);
  if (!tag) return { ok: false, reason: "empty", tags };
  if (tags.length >= LIMITS.tagMax) return { ok: false, reason: "limit", tags };
  if (tags.some((existing) => existing.toLowerCase() === tag.toLowerCase())) {
    return { ok: false, reason: "duplicate", tags };
  }
  return { ok: true, tags: [...tags, tag] };
}

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/* -------------------------------------------------------------------------- */
/* Validation and normalising                                                 */
/* -------------------------------------------------------------------------- */

export function validateValues(
  values: LearningLogFormValues,
): LearningLogFormErrors {
  const errors: LearningLogFormErrors = {};
  const title = values.title.trim();

  if (!title) errors.title = "Nhập tiêu đề buổi học.";
  else if (title.length < LIMITS.titleMin) {
    errors.title = `Tiêu đề cần ít nhất ${LIMITS.titleMin} ký tự.`;
  } else if (title.length > LIMITS.titleMax) {
    errors.title = `Tiêu đề tối đa ${LIMITS.titleMax} ký tự.`;
  }

  if (!values.skillId) errors.skillId = "Chọn kỹ năng chính.";

  if (!values.learningDate) errors.learningDate = "Chọn ngày học.";

  if (values.goal.trim().length > LIMITS.goalMax) {
    errors.goal = `Mục tiêu tối đa ${LIMITS.goalMax} ký tự.`;
  }
  if (values.notes.trim().length > LIMITS.notesMax) {
    errors.notes = `Nội dung tối đa ${LIMITS.notesMax} ký tự.`;
  }

  const url = values.referenceUrl.trim();
  if (url && !isHttpUrl(url)) {
    errors.referenceUrl = "Nhập đường dẫn bắt đầu bằng http:// hoặc https://.";
  }

  return errors;
}

/** Trims text, drops empty optional fields and turns the form's strings into a draft. */
export function toDraft(values: LearningLogFormValues): LearningLogDraft {
  const minutes = Number(values.duration);
  const url = values.referenceUrl.trim();
  return {
    title: values.title.trim(),
    skillId: values.skillId as LearningSkillId,
    durationMinutes:
      values.duration && Number.isFinite(minutes) && minutes > 0
        ? minutes
        : undefined,
    learningDate: values.learningDate,
    goal: values.goal.trim(),
    notes: values.notes.trim(),
    tags: values.tags,
    referenceUrls: url ? [new URL(url).href] : [],
    status: values.status,
  };
}

/** True when the user changed anything, including a half-typed tag. */
export function isDirty(
  values: LearningLogFormValues,
  initial: LearningLogFormValues,
  pendingTag = "",
): boolean {
  return (
    pendingTag.trim() !== "" ||
    JSON.stringify(values) !== JSON.stringify(initial)
  );
}

/* -------------------------------------------------------------------------- */
/* Lists and totals                                                           */
/* -------------------------------------------------------------------------- */

/** Newest day first; within a day, newest created first. */
export function sortLogs(logs: LearningLog[]): LearningLog[] {
  return [...logs].sort(
    (a, b) =>
      b.learningDate.localeCompare(a.learningDate) ||
      b.createdAt.localeCompare(a.createdAt),
  );
}

export function logsOnDate(logs: LearningLog[], date: string): LearningLog[] {
  return sortLogs(logs).filter((log) => log.learningDate === date);
}

/** The newest day that has a log, or undefined without logs. */
export function latestLogDate(logs: LearningLog[]): string | undefined {
  return logs.reduce<string | undefined>(
    (latest, log) =>
      !latest || log.learningDate > latest ? log.learningDate : latest,
    undefined,
  );
}

const DAY = 24 * 60 * 60 * 1000;
const dayNumber = (date: string) => Date.parse(`${date}T00:00:00Z`) / DAY;

export interface LearningTotals {
  logs: number;
  minutes: number;
}

/** Logs and minutes in the `days` days ending on `today` (inclusive). */
export function totalsForPeriod(
  logs: LearningLog[],
  days: number,
  today: string = toLocalDateKey(),
): LearningTotals {
  const end = dayNumber(today);
  const inPeriod = logs.filter((log) => {
    const age = end - dayNumber(log.learningDate);
    return age >= 0 && age < days;
  });
  return {
    logs: inPeriod.length,
    minutes: inPeriod.reduce((sum, log) => sum + (log.durationMinutes ?? 0), 0),
  };
}
