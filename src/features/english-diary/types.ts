export type DiarySkill =
  "listening" | "speaking" | "reading" | "writing" | "vocabulary";

/** "draft" = still being written; "completed" = the session is over (not "mastered"). */
export type DiaryStatus = "draft" | "completed";

export interface DiaryLog {
  id: string;
  title: string;
  skill: DiarySkill;
  /** Local calendar day, YYYY-MM-DD. */
  date: string;
  durationMinutes?: number;
  goal: string;
  content: string;
  vocabulary: string[];
  /** URLs or free-text references. */
  resources: string[];
  tags: string[];
  notes: string;
  status: DiaryStatus;
  isArchived: boolean;
  /** ISO timestamp; orders logs within the same day. */
  createdAt: string;
}

/** What the form edits: a log without its identity fields. */
export type DiaryLogDraft = Omit<DiaryLog, "id" | "createdAt" | "isArchived">;
