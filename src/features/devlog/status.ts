import type {
  DevlogEntry,
  DevlogModule,
  DevlogProject,
  DevlogStatus,
  PeriodProgress,
  ProjectStatus,
  ProjectSummary,
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

export function getModuleLabel(moduleId: string) {
  return (
    DEVLOG_MODULES.find((module) => module.id === moduleId)?.label ?? moduleId
  );
}

/** The first paragraph of the entry, which cards show as its summary. */
export function getEntrySummary(entry: DevlogEntry) {
  const first = entry.body.find((block) => block.type === "paragraph");
  return first?.type === "paragraph" ? first.text : "";
}

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

export interface DevlogFilters {
  module?: string[];
  tag?: string[];
  status?: string[];
  /** Words that must all appear in the title, text, tags or module name. */
  query?: string;
}

/**
 * Entries of the chosen modules AND carrying any of the chosen tags AND in
 * any of the chosen statuses AND containing every word of `query`.
 */
export function filterEntries(entries: DevlogEntry[], filters: DevlogFilters) {
  const modules = filters.module ?? [];
  const tags = filters.tag ?? [];
  const statuses = filters.status ?? [];
  const words = (filters.query ?? "")
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  return entries.filter((entry) => {
    if (modules.length > 0 && !modules.includes(entry.module)) return false;
    if (tags.length > 0 && !entry.tags.some((tag) => tags.includes(tag)))
      return false;
    if (statuses.length > 0 && !statuses.includes(entry.status)) return false;
    if (words.length === 0) return true;
    const text = [
      entry.title,
      getModuleLabel(entry.module),
      entry.tags.join(" "),
      entry.body
        .map((block) =>
          block.type === "paragraph"
            ? block.text
            : block.type === "list"
              ? block.items.join(" ")
              : "",
        )
        .join(" "),
    ]
      .join(" ")
      .toLowerCase();
    return words.every((word) => text.includes(word));
  });
}

/** Counts, progress and latest date of each project, from all entries. */
export function computeProjectSummaries(
  entries: DevlogEntry[],
  projects: DevlogProject[],
): ProjectSummary[] {
  const newestFirst = sortEntries(entries);
  return projects.map((project) => {
    const own = newestFirst.filter((entry) => entry.module === project.id);
    return {
      ...project,
      entryCount: own.length,
      doneCount: own.filter((entry) => entry.status === "done").length,
      inProgressCount: own.filter((entry) => entry.status === "in_progress")
        .length,
      progress: own[0]?.progress ?? 0,
      lastEntryAt: own[0]?.date ?? null,
    };
  });
}

/** `Blog cá nhân` → `custom-blog-ca-nhan`: an id that cannot clash with a module's. */
export function toCustomProjectId(label: string) {
  const slug = label
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `custom-${slug || "project"}`;
}

/**
 * What moved in the last `days` days, counted back from the newest entry (not
 * from the clock, so it can be prerendered). A module's gain is its progress
 * now minus its progress at its last entry before the period.
 */
export function computePeriodProgress(
  entries: DevlogEntry[],
  days: number,
  modules: DevlogModule[] = DEVLOG_MODULES,
): PeriodProgress {
  const newestFirst = sortEntries(entries);
  const endsAt = newestFirst[0]?.date ?? null;
  const firstDay = endsAt ? dayNumber(endsAt) - days + 1 : 0;
  const isInPeriod = (entry: DevlogEntry) => dayNumber(entry.date) >= firstDay;

  const moduleProgress = modules.map((module) => {
    const own = newestFirst.filter((entry) => entry.module === module.id);
    const inPeriod = own.filter(isInPeriod);
    const before = own.find((entry) => !isInPeriod(entry));
    const progress = own[0]?.progress ?? 0;
    return {
      ...module,
      progress,
      gained:
        inPeriod.length > 0
          ? Math.max(0, progress - (before?.progress ?? 0))
          : 0,
      entryCount: inPeriod.length,
    };
  });

  return {
    days,
    endsAt,
    modules: moduleProgress,
    totalGained: moduleProgress.reduce((sum, m) => sum + m.gained, 0),
    totalEntries: moduleProgress.reduce((sum, m) => sum + m.entryCount, 0),
  };
}
