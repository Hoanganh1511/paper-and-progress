export type BookmarkDomain = "it" | "english" | "life-skills";

export type BookmarkContentType = "video" | "text" | "quiz" | "code-lab";

export type BookmarkLevel = "beginner" | "intermediate" | "advanced";

export type BookmarkStatus = "not-started" | "in-progress" | "completed";

export interface Bookmark {
  id: string;
  title: string;
  description: string;
  /** Where "Mở bài" leads. */
  href: string;
  /** The folder it sits in; `null` when it has not been sorted yet. */
  folderId: string | null;
  domain: BookmarkDomain;
  tags: string[];
  contentType: BookmarkContentType;
  level: BookmarkLevel;
  status: BookmarkStatus;
  /** Learning progress from 0 to 100. */
  progress: number;
  durationMinutes: number;
  /** When the bookmark was saved, as an ISO date-time. */
  savedAt: string;
}

/** A user-made folder; folders nest through `parentId`. */
export interface BookmarkFolder {
  id: string;
  label: string;
  parentId: string | null;
}

/** Everything the bookmarks page needs, plus the moment it was read. */
export interface BookmarkLibrary {
  bookmarks: Bookmark[];
  folders: BookmarkFolder[];
  /** ISO date-time that "saved ago" and the date filters are measured from. */
  now: string;
}
