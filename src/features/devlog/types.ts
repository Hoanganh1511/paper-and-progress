export type DevlogStatus = "in_progress" | "done";

/** One block of an entry's text. */
export type DevlogBlock =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "code"; language: string; code: string };

export interface DevlogEntry {
  /** The file name without its extension; also the entry's anchor on the page. */
  slug: string;
  title: string;
  /** Calendar day as `YYYY-MM-DD`. */
  date: string;
  tags: string[];
  /** Id of the module the entry belongs to, e.g. `design-system`. */
  module: string;
  status: DevlogStatus;
  /** How far the module is after this entry, from 0 to 100. */
  progress: number;
  /** Optional step label such as `1/6`. */
  phase?: string;
  /** Optional picture or GIF, as a path under `public/`. */
  image?: string;
  imageAlt?: string;
  body: DevlogBlock[];
}

export interface DevlogModule {
  id: string;
  label: string;
}

export interface ModuleProgress extends DevlogModule {
  progress: number;
}

export interface ProjectStatus {
  modules: ModuleProgress[];
  /** Average progress of all modules, rounded. */
  overall: number;
  /** Days in a row with an entry, counted back from the latest entry. */
  streak: number;
  entryCount: number;
  /** Date of the first entry, `YYYY-MM-DD`; `null` without entries. */
  startedAt: string | null;
}

/** A project the devlog groups entries under; an entry's `module` is its id. */
export interface DevlogProject {
  id: string;
  label: string;
  description?: string;
}

export interface ProjectSummary extends DevlogProject {
  /** Entries logged under the project. */
  entryCount: number;
  doneCount: number;
  inProgressCount: number;
  /** Progress after the project's newest entry; 0 without entries. */
  progress: number;
  /** Date of the newest entry, `YYYY-MM-DD`; `null` without entries. */
  lastEntryAt: string | null;
}

/** How far one module moved over a period of days. */
export interface PeriodModuleProgress extends DevlogModule {
  /** Progress after the module's newest entry. */
  progress: number;
  /** Points gained inside the period; 0 when nothing was logged in it. */
  gained: number;
  /** Entries logged inside the period. */
  entryCount: number;
}

export interface PeriodProgress {
  /** Length of the period in days, counted back from `endsAt` inclusive. */
  days: number;
  /** Date of the newest entry, `YYYY-MM-DD`; `null` without entries. */
  endsAt: string | null;
  modules: PeriodModuleProgress[];
  totalGained: number;
  totalEntries: number;
}
