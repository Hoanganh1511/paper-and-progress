export type DiarySkill =
  "listening" | "speaking" | "reading" | "writing" | "vocabulary";

/** "draft" = still being written; "completed" = the session is over (not "mastered"). */
export type DiaryStatus = "draft" | "completed";

/** One word of a Daily English day, with what the learner wrote for it. */
export interface LoggedWord {
  word: string;
  /** Known already, or all its sentences written. */
  isLearned: boolean;
  isKnown: boolean;
  isReview: boolean;
  /** The learner's own note on the word. */
  note?: string;
  sentences: string[];
  /** Phrases the word keeps company with; "phrase: meaning" is shown as two parts. */
  collocations: string[];
  related: string[];
  /** The other ways of remembering it (word family, phrasal verbs, synonyms...), each with its name. */
  others?: { label: string; items: string[] }[];
}

/** What a Daily English day produced, kept as data so the log can lay it out. */
export interface DailyEnglishNotes {
  /** Words learned out of all the day's words; missing when sentences are not required. */
  learned?: number;
  total?: number;
  words: LoggedWord[];
}

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
  /** Set on the log Daily English keeps for a day. */
  dailyEnglish?: DailyEnglishNotes;
  status: DiaryStatus;
  isArchived: boolean;
  /** ISO timestamp; orders logs within the same day. */
  createdAt: string;
}

/** What the form edits: a log without its identity fields. */
export type DiaryLogDraft = Omit<DiaryLog, "id" | "createdAt" | "isArchived">;
