export type VocabSection =
  | "TOPIC_CONTRAST"
  | "PHRASAL_VERB"
  | "PHRASE_COLLOCATION"
  | "WORD_PATTERN"
  | "WORD_FORMATION";

export type LessonType = "NEW" | "REVIEW" | "FINAL_TEST";

export interface GateProgress {
  learnCompleted: boolean;
  practiceCompleted: boolean;
  testCompleted: boolean;
  /** Score of the latest test, 0 to 100. */
  testScore: number | null;
  bestScore: number | null;
  /** True once a test scored 70% or more: the platform is open for today. */
  gateUnlocked: boolean;
}

export interface GateUnit {
  id: number;
  unitNumber: number;
  topic: string;
}

export interface ActiveToday {
  active: true;
  lessonId: number;
  dayNumber: number;
  /** `YYYY-MM-DD` */
  date: string;
  type: LessonType;
  units: GateUnit[];
  totalWords: number;
  /** False while the words of these units are still to be written; nothing is locked then. */
  isReady: boolean;
  progress: GateProgress;
}

export interface InactiveToday {
  active: false;
  reason: "NOT_STARTED" | "FINISHED" | "NONE";
  startDate?: string;
}

export type TodayResponse = ActiveToday | InactiveToday;

export interface LearnWord {
  id: number;
  word: string;
  meaning: string;
  example: string | null;
  contrast: string | null;
  forms: string | null;
  pattern: string | null;
}

export interface LearnSection {
  type: VocabSection;
  words: LearnWord[];
}

export interface LearnResponse {
  lessonId: number;
  unitTopic: string;
  sections: LearnSection[];
  totalWords: number;
}

export interface MatchingQuestion {
  id: number;
  type: "MATCHING";
  instruction: string;
  left: string[];
  /** The meanings, shuffled; `answer[i]` is the index in `right` that fits `left[i]`. */
  right: string[];
  answer: number[];
}

export interface ChoiceQuestion {
  id: number;
  type: "FILL_BLANK" | "CHOOSE_CONTRAST";
  instruction: string;
  sentence: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export type PracticeQuestion = MatchingQuestion | ChoiceQuestion;

export interface PracticeResponse {
  lessonId: number;
  questions: PracticeQuestion[];
}

export type PracticeAnswerValue = number | number[];

export interface PracticeResult {
  score: number;
  details: {
    questionId: number;
    correct: boolean;
    points: number;
    explanation?: string;
  }[];
}

export interface TestQuestion {
  id: number;
  type: "MULTIPLE_CHOICE";
  question: string;
  options: string[];
}

export interface TestResponse {
  lessonId: number;
  attempt: number;
  questions: TestQuestion[];
  /** Seconds. */
  timeLimit: number;
  passScore: number;
}

export interface TestResult {
  score: number;
  passed: boolean;
  gateUnlocked: boolean;
  results: {
    questionId: number;
    correct: boolean;
    correctAnswer: number;
    yourAnswer: number | null;
    explanation: string;
  }[];
}

export interface GateStats {
  totalDays: number;
  completedDays: number;
  currentStreak: number;
  longestStreak: number;
  averageScore: number | null;
  totalWordsLearned: number;
  weakWords: {
    wordId: number;
    word: string;
    meaning: string;
    wrongCount: number;
  }[];
}

export interface CalendarDay {
  dayNumber: number;
  date: string;
  type: LessonType;
  topic: string;
  completed: boolean;
  score: number | null;
  isToday: boolean;
  isPast: boolean;
}
