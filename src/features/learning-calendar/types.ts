export type ActivityType =
  | "DAILY_LESSON"
  | "DAILY_PRACTICE"
  | "DAILY_TEST"
  | "PHRASE_WRITE"
  | "PHRASE_RECALL"
  | "PHRASE_SPEAK";

export type Intensity = 0 | 1 | 2 | 3 | 4;

export interface CalendarDay {
  /** `YYYY-MM-DD` in Asia/Ho_Chi_Minh. */
  date: string;
  hasActivity: boolean;
  activityCount: number;
  intensity: Intensity;
}

export interface MonthRef {
  year: number;
  /** 1 to 12 */
  month: number;
}

/** What the calendar is for, e.g. "B2 English". */
export interface LearningGoal {
  language: string;
  level: string;
  label: string;
}

export interface CalendarResponse {
  /** The server's today; the one date the whole calendar agrees on. */
  today: string;
  goal: LearningGoal;
  month: MonthRef & { timezone: string; daysInMonth: number };
  summary: {
    learningDaysInMonth: number;
    learningDaysTotal: number;
    currentStreak: number;
    longestStreak: number;
  };
  days: CalendarDay[];
}

export interface DayActivity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  status: "COMPLETED" | "IN_PROGRESS";
  /** ISO time with the +07:00 offset, or null when the module does not record it. */
  occurredAt: string | null;
  /** Where the activity opens; null means read-only. */
  targetUrl: string | null;
}

export interface DayResponse {
  date: string;
  hasActivity: boolean;
  summary: {
    activityCount: number;
    /** Null: nothing records how long a learner studied. */
    durationMinutes: number | null;
  };
  activities: DayActivity[];
}
