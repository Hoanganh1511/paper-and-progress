export type LearningSkillId =
  "programming" | "english" | "design" | "reading" | "other";

/** "completed" only means the session is over, not that the topic is mastered. */
export type LearningLogStatus = "completed" | "in_progress" | "not_completed";

export interface LearningLog {
  id: string;
  title: string;
  skillId: LearningSkillId;
  /** Minutes; absent when the user did not say. */
  durationMinutes?: number;
  /** Local calendar day, YYYY-MM-DD. */
  learningDate: string;
  goal: string;
  notes: string;
  tags: string[];
  /** http(s) URLs only. */
  referenceUrls: string[];
  status: LearningLogStatus;
  /** ISO timestamps. */
  createdAt: string;
  updatedAt: string;
}

/** What the form produces: a log before it has an id and timestamps. */
export type LearningLogDraft = Omit<
  LearningLog,
  "id" | "createdAt" | "updatedAt"
>;

/** The form's fields as typed: strings, before validation and normalising. */
export interface LearningLogFormValues {
  title: string;
  /** "" until the user picks one. */
  skillId: LearningSkillId | "";
  /** Minutes as a string; "" for none. */
  duration: string;
  learningDate: string;
  goal: string;
  notes: string;
  tags: string[];
  referenceUrl: string;
  status: LearningLogStatus;
}

export type LearningLogFormErrors = Partial<
  Record<
    "title" | "skillId" | "learningDate" | "goal" | "notes" | "referenceUrl",
    string
  >
>;
