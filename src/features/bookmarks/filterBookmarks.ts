import type { FilterValue } from "@/design-system";
import { LEVEL_ORDER } from "./labels";
import type { Bookmark, BookmarkFolder } from "./types";

/** Folder view showing every bookmark. */
export const ALL_FOLDERS = "all";
/** Folder view showing bookmarks that sit in no folder. */
export const UNSORTED_FOLDER = "unsorted";

/** Ids of the filter groups, shared with the FilterPanel groups. */
export const FILTER_IDS = {
  domain: "domain",
  tag: "tag",
  type: "type",
  level: "level",
  status: "status",
  saved: "saved",
} as const;

export type BookmarkSortKey = "savedAt" | "title" | "progress" | "level";
export type SortDirection = "asc" | "desc";

export interface BookmarkSort {
  key: BookmarkSortKey;
  direction: SortDirection;
}

export interface BookmarkQuery {
  /** Text matched against title, description and tags. */
  search: string;
  folderId: string;
  filters: FilterValue;
}

/** Lower-cases and strips accents so "tien do" finds "Tiến độ". */
export function normalizeSearchText(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

/** The folder with all folders below it. */
export function getFolderIdsWithin(
  folders: BookmarkFolder[],
  folderId: string,
): string[] {
  const ids = [folderId];
  for (const child of folders.filter((f) => f.parentId === folderId)) {
    ids.push(...getFolderIdsWithin(folders, child.id));
  }
  return ids;
}

function isSavedWithin(savedAt: string, range: string, now: string) {
  const saved = Date.parse(savedAt);
  const current = new Date(now);
  const startOfToday = new Date(
    current.getFullYear(),
    current.getMonth(),
    current.getDate(),
  ).getTime();
  const day = 24 * 60 * 60 * 1000;

  if (range === "today") return saved >= startOfToday;
  if (range === "week") return saved >= startOfToday - 6 * day;
  if (range === "month") return saved >= startOfToday - 29 * day;
  return true;
}

function matchesFolder(
  bookmark: Bookmark,
  folders: BookmarkFolder[],
  folderId: string,
) {
  if (folderId === ALL_FOLDERS) return true;
  if (folderId === UNSORTED_FOLDER) return bookmark.folderId === null;
  return (
    bookmark.folderId !== null &&
    getFolderIdsWithin(folders, folderId).includes(bookmark.folderId)
  );
}

/** Every group narrows the result (AND); within a group any chosen option fits (OR). */
export function filterBookmarks(
  bookmarks: Bookmark[],
  folders: BookmarkFolder[],
  query: BookmarkQuery,
  now: string,
): Bookmark[] {
  const search = normalizeSearchText(query.search.trim());
  const { filters } = query;
  const anyOf = (id: string) => filters[id] ?? [];

  return bookmarks.filter((bookmark) => {
    if (!matchesFolder(bookmark, folders, query.folderId)) return false;

    if (search) {
      const haystack = normalizeSearchText(
        [bookmark.title, bookmark.description, ...bookmark.tags].join(" "),
      );
      if (!haystack.includes(search)) return false;
    }

    const domains = anyOf(FILTER_IDS.domain);
    if (domains.length && !domains.includes(bookmark.domain)) return false;

    const tags = anyOf(FILTER_IDS.tag);
    if (tags.length && !bookmark.tags.some((tag) => tags.includes(tag))) {
      return false;
    }

    const types = anyOf(FILTER_IDS.type);
    if (types.length && !types.includes(bookmark.contentType)) return false;

    const levels = anyOf(FILTER_IDS.level);
    if (levels.length && !levels.includes(bookmark.level)) return false;

    const statuses = anyOf(FILTER_IDS.status);
    if (statuses.length && !statuses.includes(bookmark.status)) return false;

    const [saved] = anyOf(FILTER_IDS.saved);
    if (saved && !isSavedWithin(bookmark.savedAt, saved, now)) return false;

    return true;
  });
}

const collator = new Intl.Collator("vi");

export function sortBookmarks(
  bookmarks: Bookmark[],
  { key, direction }: BookmarkSort,
): Bookmark[] {
  const sign = direction === "asc" ? 1 : -1;

  return [...bookmarks].sort((a, b) => {
    switch (key) {
      case "title":
        return sign * collator.compare(a.title, b.title);
      case "progress":
        return sign * (a.progress - b.progress);
      case "level":
        return sign * (LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]);
      case "savedAt":
        return sign * (Date.parse(a.savedAt) - Date.parse(b.savedAt));
    }
  });
}

/** Bookmarks per folder id, plus the `all` and `unsorted` totals. */
export function countByFolder(
  bookmarks: Bookmark[],
  folders: BookmarkFolder[],
): Record<string, number> {
  const counts: Record<string, number> = {
    [ALL_FOLDERS]: bookmarks.length,
    [UNSORTED_FOLDER]: bookmarks.filter((b) => b.folderId === null).length,
  };
  for (const folder of folders) {
    const ids = getFolderIdsWithin(folders, folder.id);
    counts[folder.id] = bookmarks.filter(
      (b) => b.folderId !== null && ids.includes(b.folderId),
    ).length;
  }
  return counts;
}

export interface FolderPath {
  folder: BookmarkFolder;
  /** "React / Hooks": the names from the top level down. */
  path: string;
}

/** Every folder in tree order (parents before their children) with its path. */
export function flattenFolders(
  folders: BookmarkFolder[],
  parentId: string | null = null,
  prefix = "",
): FolderPath[] {
  return folders
    .filter((folder) => folder.parentId === parentId)
    .flatMap((folder) => {
      const path = prefix ? `${prefix} / ${folder.label}` : folder.label;
      return [{ folder, path }, ...flattenFolders(folders, folder.id, path)];
    });
}
