import {
  CONTENT_CATEGORIES,
  type CategoryItem,
  type ContentCategory,
  type WordBasics,
  type WordContent,
  type WordDetailFull,
  type WordPayload,
} from "./types";

/** Everything the editor holds: the word's own fields and the ten lists. */
export interface WordForm {
  basics: WordBasics;
  content: WordContent;
}

export const emptyContent = (): WordContent =>
  Object.fromEntries(
    CONTENT_CATEGORIES.map((category) => [category, [] as CategoryItem[]]),
  ) as unknown as WordContent;

export const emptyForm = (): WordForm => ({
  basics: {
    unitId: undefined,
    section: "TOPIC_CONTRAST",
    word: "",
    pronunciation: "",
    partsOfSpeech: [],
    level: "",
    topics: [],
    meaning: "",
    meaningVi: "",
    example: "",
    contrast: "",
    forms: "",
    pattern: "",
  },
  content: emptyContent(),
});

/** A saved word as the form holds it. Items keep the ids they were saved with. */
export function fromDetail(detail: WordDetailFull): WordForm {
  const content = emptyContent();
  for (const category of CONTENT_CATEGORIES) {
    content[category] = (detail[category] ?? []).map(
      (item) => ({ ...item }) as CategoryItem,
    );
  }
  return {
    basics: {
      unitId: detail.unitId,
      section: detail.section,
      word: detail.word,
      pronunciation: detail.pronunciation,
      partsOfSpeech: [...detail.partsOfSpeech],
      level: detail.level ?? "",
      topics: [...detail.topics],
      meaning: detail.meaning,
      meaningVi: detail.meaningVi,
      example: detail.example,
      contrast: detail.contrast,
      forms: detail.forms,
      pattern: detail.pattern,
    },
    content,
  };
}

/**
 * What is sent to save. Call it only once the basics are valid. The word's text
 * fields are trimmed; the items go as they are, in their order.
 */
export function toPayload(form: WordForm): WordPayload {
  const { basics, content } = form;
  return {
    ...basics,
    unitId: basics.unitId as number,
    level: basics.level as WordPayload["level"],
    word: basics.word.trim(),
    pronunciation: basics.pronunciation.trim(),
    meaning: basics.meaning.trim(),
    meaningVi: basics.meaningVi.trim(),
    example: basics.example.trim(),
    contrast: basics.contrast.trim(),
    forms: basics.forms.trim(),
    pattern: basics.pattern.trim(),
    ...content,
  };
}

/** Whether the form differs from what was loaded or last saved. */
export const isDirty = (current: WordForm, saved: WordForm) =>
  JSON.stringify(current) !== JSON.stringify(saved);

export const countOf = (form: WordForm, category: ContentCategory) =>
  form.content[category].length;
