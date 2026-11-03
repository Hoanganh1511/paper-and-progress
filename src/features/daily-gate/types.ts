import type {
  CategoryItem,
  ContentCategory,
} from "@/features/vocabulary-admin/types";
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
  /** Words with all their sentences written; kept on the server. */
  learnedWords?: number;
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
  // What the admin wrote for the word, when they did (see the vocabulary admin).
  pronunciation?: string | null;
  partsOfSpeech?: string[];
  level?: string | null;
  topics?: string[];
  meaningVi?: string | null;
  /** Only the categories that have items. */
  content?: Partial<Record<ContentCategory, CategoryItem[]>>;
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
  /** Sentences the learner must write for each word before it counts as learned. */
  sentencesPerWord?: number;
  /** What the learner wrote today, by word id: sentences, collocations and related words. */
  entries?: Record<number, WordEntry[]>;
  /** "Đã biết" / "Cần ôn lại", by word id; kept on the server. */
  marks?: Record<number, "known" | "review">;
}

/** What a learner writes for a word: sentences (required) and one list for each way of remembering it. */
export type EntryKind =
  | "SENTENCE"
  | "COLLOCATION"
  | "RELATED"
  | "WORD_FAMILY"
  | "PHRASAL_VERB"
  | "WORD_PATTERN"
  | "WORD_FORMATION"
  | "DEPENDENT_PREPOSITION"
  | "SYNONYM"
  | "ANTONYM"
  | "CONVERSATION";

export interface WordEntry {
  id: number;
  kind: EntryKind;
  text: string;
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

/** Where a phrase of the notebook is in the 4-step method: its next step. */
export type PhraseStage = "WRITE" | "RECALL" | "SPEAK" | "MASTERED";

export interface Phrase {
  id: string;
  /** The lesson word it was saved from; null for a phrase the user typed in. */
  wordId: number | null;
  phrase: string;
  /** The user's own words for what it means. */
  meaning: string;
  sampleSentence: string | null;
  stage: PhraseStage;
  intervalDays: number;
  /** `YYYY-MM-DD` */
  nextReviewAt: string;
  easyStreak: number;
  speakPassed: boolean;
  createdAt: string;
}

export interface PhraseSummary {
  total: number;
  mastered: number;
  /** Phrases that still wait for their first sentence. */
  unwritten: number;
  due: number;
  /** Days in a row with any activity in the notebook (its own streak, not the gate's). */
  streak: number;
  practicedToday: boolean;
}

export interface NewPhrase {
  phrase: string;
  meaning: string;
  sampleSentence?: string;
  wordId?: number;
}

export type PhraseChanges = Partial<Omit<NewPhrase, "wordId">>;

export type RecallGrade = "FORGOT" | "HARD" | "EASY";

export interface ReviewInput {
  /** The phrase as the user typed it from memory. */
  answer: string;
  usedHint: boolean;
  grade: RecallGrade;
  /** A new sentence with the phrase; required for HARD and EASY. */
  sentence?: string;
}

export interface ReviewResult {
  isAnswerCorrect: boolean;
  phrase: Phrase;
}

export interface PhraseExampleResult {
  example: { id: string; text: string };
  phrase: Phrase;
}

export interface SpokenResult {
  containsPhrase: boolean;
  /** Indexes of the transcript's words (split like `tokenize`) that matched the phrase. */
  matchedIndexes: number[];
  phrase: Phrase;
}
