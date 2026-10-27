import type {
  DevlogEntry,
  DevlogModule,
  DevlogStatus,
  ProjectStatus,
} from "./types";

/** The parts of the project the overview tracks, in display order. */
export const DEVLOG_MODULES: DevlogModule[] = [
  { id: "design-system", label: "Design System" },
  { id: "content", label: "Content Pages" },
  { id: "auth", label: "Auth & Security" },
  { id: "database", label: "Database" },
];

export const STATUS_LABELS: Record<DevlogStatus, string> = {
  in_progress: "Đang làm",
  done: "Hoàn thành",
};

/** `2026-10-27` → `27/10/2026`. */
export function formatDevlogDate(date: string) {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

const DAY = 24 * 60 * 60 * 1000;
const dayNumber = (date: string) => Date.parse(`${date}T00:00:00Z`) / DAY;

/** Newest first; on the same day the later file name counts as newer. */
export function sortEntries(entries: DevlogEntry[]) {
  return [...entries].sort(
    (a, b) => b.date.localeCompare(a.date) || b.slug.localeCompare(a.slug),
  );
}

/**
 * Progress per module is the progress of its newest entry, the overall figure
 * is their average, and the streak counts the days in a row that have an
 * entry, going back from the newest one. Nothing here reads the clock, so it
 * can be prerendered.
 */
export function computeProjectStatus(
  entries: DevlogEntry[],
  modules: DevlogModule[] = DEVLOG_MODULES,
): ProjectStatus {
  const newestFirst = sortEntries(entries);

  const moduleProgress = modules.map((module) => ({
    ...module,
    progress:
      newestFirst.find((entry) => entry.module === module.id)?.progress ?? 0,
  }));
  const overall = moduleProgress.length
    ? Math.round(
        moduleProgress.reduce((sum, m) => sum + m.progress, 0) /
          moduleProgress.length,
      )
    : 0;

  const days = [...new Set(newestFirst.map((entry) => dayNumber(entry.date)))];
  let streak = days.length ? 1 : 0;
  for (let i = 1; i < days.length && days[i - 1] - days[i] === 1; i += 1) {
    streak += 1;
  }

  return {
    modules: moduleProgress,
    overall,
    streak,
    entryCount: entries.length,
    startedAt: newestFirst.at(-1)?.date ?? null,
  };
}

/** Entries of the chosen modules AND carrying any of the chosen tags. */
export function filterEntries(
  entries: DevlogEntry[],
  filters: { module?: string[]; tag?: string[] },
) {
  const modules = filters.module ?? [];
  const tags = filters.tag ?? [];
  return entries.filter(
    (entry) =>
      (modules.length === 0 || modules.includes(entry.module)) &&
      (tags.length === 0 || entry.tags.some((tag) => tags.includes(tag))),
  );
}
