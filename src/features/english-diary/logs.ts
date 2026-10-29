import type { DiaryLog, DiaryLogDraft, DiarySkill, DiaryStatus } from "./types";

export const SKILL_LABELS: Record<DiarySkill, string> = {
  listening: "Nghe",
  speaking: "Nói",
  reading: "Đọc",
  writing: "Viết",
  vocabulary: "Từ vựng",
};

export const SKILLS = Object.keys(SKILL_LABELS) as DiarySkill[];

export const STATUS_LABELS: Record<DiaryStatus, string> = {
  draft: "Bản nháp",
  completed: "Hoàn thành",
};

export interface DiaryFilters {
  query: string;
  skill: DiarySkill | "all";
  isArchived: boolean;
}

/** Today as a local YYYY-MM-DD (toISOString would shift the day by timezone). */
export function toLocalDateKey(date: Date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** "2026-10-27" -> "27/10/2026". */
export function formatDiaryDate(date: string): string {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

export function formatDuration(minutes?: number): string | undefined {
  return minutes ? `${minutes} phút` : undefined;
}

export function createEmptyDraft(
  today: string = toLocalDateKey(),
): DiaryLogDraft {
  return {
    title: "",
    skill: "speaking",
    date: today,
    durationMinutes: undefined,
    goal: "",
    content: "",
    vocabulary: [],
    resources: [],
    tags: [],
    notes: "",
    status: "draft",
  };
}

/** One entry per non-empty line. */
export function splitLines(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function splitTags(text: string): string[] {
  return text
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

/** Newest day first; within a day, newest created first. */
export function sortLogs(logs: DiaryLog[]): DiaryLog[] {
  return [...logs].sort(
    (a, b) =>
      b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
  );
}

export function filterLogs(
  logs: DiaryLog[],
  filters: DiaryFilters,
): DiaryLog[] {
  const query = filters.query.trim().toLowerCase();
  return sortLogs(logs).filter((log) => {
    if (log.isArchived !== filters.isArchived) return false;
    if (filters.skill !== "all" && log.skill !== filters.skill) return false;
    if (!query) return true;
    return [log.title, log.goal, log.content, log.notes, ...log.tags]
      .join("\n")
      .toLowerCase()
      .includes(query);
  });
}

export interface DiaryDayGroup {
  date: string;
  logs: DiaryLog[];
}

/** Groups logs that are already sorted; keeps their order. */
export function groupLogsByDate(logs: DiaryLog[]): DiaryDayGroup[] {
  const groups: DiaryDayGroup[] = [];
  for (const log of logs) {
    const last = groups.at(-1);
    if (last?.date === log.date) last.logs.push(log);
    else groups.push({ date: log.date, logs: [log] });
  }
  return groups;
}

export function duplicateLog(log: DiaryLog, id: string, now: Date): DiaryLog {
  return {
    ...log,
    id,
    title: `${log.title} (bản sao)`,
    date: toLocalDateKey(now),
    status: "draft",
    isArchived: false,
    createdAt: now.toISOString(),
  };
}

/** Only http(s) URLs become links; anything else stays plain text. */
export function toSafeUrl(reference: string): string | undefined {
  try {
    const url = new URL(reference);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.href
      : undefined;
  } catch {
    return undefined;
  }
}
