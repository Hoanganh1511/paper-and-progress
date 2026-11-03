export const CONTENT_CATEGORIES = [
  "wordFamily",
  "collocations",
  "phrasalVerbs",
  "wordPatterns",
  "wordFormation",
  "dependentPrepositions",
  "synonyms",
  "antonyms",
  "relatedVocabulary",
  "conversations",
] as const;
export type ContentCategory = (typeof CONTENT_CATEGORIES)[number];

/** One item of a category. The fields differ by category; they are all text. */
export type CategoryItem = { id: string } & Record<string, string>;

export type WordContent = Record<ContentCategory, CategoryItem[]>;

/** Empty: nothing yet. In progress: an item is missing a required field. Completed: all items filled. */
export type CategoryState = "EMPTY" | "IN_PROGRESS" | "COMPLETED";

export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
export const CEFR_LEVELS: readonly CefrLevel[] = [
  "A1",
  "A2",
  "B1",
  "B2",
  "C1",
  "C2",
];

export type VocabSection =
  | "TOPIC_CONTRAST"
  | "PHRASAL_VERB"
  | "PHRASE_COLLOCATION"
  | "WORD_PATTERN"
  | "WORD_FORMATION";

export interface VocabUnit {
  id: number;
  unitNumber: number;
  topic: string;
}

export interface VocabMeta {
  units: VocabUnit[];
  sections: VocabSection[];
}

export interface CategorySummary {
  count: number;
  state: CategoryState;
}

/** A row of the list. */
export interface WordSummary {
  id: number;
  word: string;
  meaning: string;
  meaningVi: string;
  level: CefrLevel | null;
  partsOfSpeech: string[];
  section: VocabSection;
  unit: VocabUnit;
  categories: Record<ContentCategory, CategorySummary>;
  updatedAt: string;
}

/** The fields of the word itself, as the form holds them. */
export interface WordBasics {
  unitId: number | undefined;
  section: VocabSection;
  word: string;
  pronunciation: string;
  partsOfSpeech: string[];
  level: CefrLevel | "";
  topics: string[];
  /** The short definition, in English. */
  meaning: string;
  meaningVi: string;
  // What the flashcard of the lesson shows.
  example: string;
  contrast: string;
  forms: string;
  pattern: string;
}

export interface WordDetail extends Omit<WordBasics, "level" | "unitId"> {
  id: number;
  unitId: number;
  unitTopic: string;
  level: CefrLevel | null;
  updatedAt: string;
  categories: Record<ContentCategory, CategorySummary>;
  // plus one list per category (see WordContent)
}
export type WordDetailFull = WordDetail & WordContent;

/** What is sent to save a word: the word's fields and all ten lists. */
export type WordPayload = Omit<WordBasics, "level" | "unitId"> & {
  unitId: number;
  level: CefrLevel;
} & WordContent;

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
