import {
  CATEGORIES,
  CATEGORY_BY_KEY,
  duplicateOf,
  missingFields,
  moveItem,
  newItem,
  stateOf,
} from "./categories";
import { emptyForm, fromDetail, isDirty, toPayload } from "./form";
import {
  CONTENT_CATEGORIES,
  type CategoryItem,
  type WordDetailFull,
} from "./types";
import { validateBasics } from "./validate";

describe("categories", () => {
  it("has the ten learning categories, in the order of the form", () => {
    expect(CATEGORIES.map((category) => category.key)).toEqual([
      ...CONTENT_CATEGORIES,
    ]);
    expect(CATEGORIES).toHaveLength(10);
  });

  it("asks of each category what the server counts as finished", () => {
    // Mirrors REQUIRED_ITEM_FIELDS of the backend: if one changes, so must the other.
    const required = Object.fromEntries(
      CATEGORIES.map((category) => [
        category.key,
        category.fields.filter((f) => f.required).map((f) => f.key),
      ]),
    );
    expect(required).toEqual({
      wordFamily: ["word", "partOfSpeech"],
      collocations: ["phrase"],
      phrasalVerbs: ["phrasalVerb", "meaning"],
      wordPatterns: ["pattern"],
      wordFormation: ["rootWord", "derivedWord"],
      dependentPrepositions: ["expression", "preposition"],
      synonyms: ["word"],
      antonyms: ["word"],
      relatedVocabulary: ["word"],
      conversations: ["situation", "speakerA", "speakerB"],
    });
  });

  it("gives every field a label and a place, with no repeated keys inside a category", () => {
    for (const category of CATEGORIES) {
      const keys = category.fields.map((field) => field.key);
      expect(new Set(keys).size).toBe(keys.length);
      for (const field of category.fields) {
        expect(field.label).not.toBe("");
        if (field.kind === "select")
          expect(field.options?.length).toBeGreaterThan(0);
      }
    }
  });

  it("tells a phrasal verb of the word from a related expression", () => {
    const origin = CATEGORY_BY_KEY.phrasalVerbs.fields.find(
      (field) => field.key === "origin",
    );
    expect(origin?.options?.map((option) => option.value)).toEqual([
      "DERIVED",
      "RELATED",
    ]);
  });
});

describe("state of a category", () => {
  const family = CATEGORY_BY_KEY.wordFamily;
  const item = (over: Record<string, string> = {}): CategoryItem => ({
    ...newItem(family),
    ...over,
  });

  it("is empty with no items, whatever the count a guide suggests", () => {
    expect(stateOf(family, [])).toBe("EMPTY");
  });

  it("is in progress while an item lacks a required field", () => {
    expect(stateOf(family, [item({ word: "artificially" })])).toBe(
      "IN_PROGRESS",
    );
    expect(missingFields(family, item({ word: "artificially" }))).toEqual([
      "Từ loại",
    ]);
  });

  it("is completed with one finished item: there is no minimum of five", () => {
    expect(
      stateOf(family, [item({ word: "artificially", partOfSpeech: "adverb" })]),
    ).toBe("COMPLETED");
  });

  it("goes back to in progress when another unfinished item is added", () => {
    const done = item({ word: "a", partOfSpeech: "adverb" });
    expect(stateOf(family, [done, item()])).toBe("IN_PROGRESS");
  });

  it("does not count blank spaces as filled", () => {
    expect(stateOf(family, [item({ word: "   ", partOfSpeech: "noun" })])).toBe(
      "IN_PROGRESS",
    );
  });
});

describe("items", () => {
  it("makes a new item with every field empty and an id of its own", () => {
    const a = newItem(CATEGORY_BY_KEY.conversations);
    const b = newItem(CATEGORY_BY_KEY.conversations);
    expect(a.id).not.toBe(b.id);
    expect(a.situation).toBe("");
    expect(a.speakerA).toBe("");
  });

  it("copies an item with a new id", () => {
    const original = { ...newItem(CATEGORY_BY_KEY.synonyms), word: "fake" };
    const copy = duplicateOf(original);
    expect(copy).toMatchObject({ word: "fake" });
    expect(copy.id).not.toBe(original.id);
  });

  it("moves an item one place, and stays put at the ends", () => {
    expect(moveItem(["a", "b", "c"], 1, -1)).toEqual(["b", "a", "c"]);
    expect(moveItem(["a", "b", "c"], 1, 1)).toEqual(["a", "c", "b"]);
    expect(moveItem(["a", "b", "c"], 0, -1)).toEqual(["a", "b", "c"]);
    expect(moveItem(["a", "b", "c"], 2, 1)).toEqual(["a", "b", "c"]);
    const original = ["a", "b"];
    moveItem(original, 0, 1);
    expect(original).toEqual(["a", "b"]);
  });
});

describe("the word form", () => {
  const filled = () => {
    const form = emptyForm();
    form.basics = {
      ...form.basics,
      unitId: 2,
      word: "  artificial ",
      partsOfSpeech: ["adjective"],
      level: "B2",
      meaning: "made by people",
      meaningVi: "nhân tạo",
    };
    return form;
  };

  it("needs only the word's own fields, and none of the ten lists", () => {
    expect(validateBasics(emptyForm().basics)).toEqual({
      unitId: "Chọn unit.",
      word: "Nhập từ.",
      partsOfSpeech: "Chọn ít nhất một từ loại.",
      level: "Chọn cấp độ.",
      meaning: "Nhập định nghĩa ngắn.",
      meaningVi: "Nhập nghĩa tiếng Việt.",
    });
    expect(validateBasics(filled().basics)).toEqual({});
  });

  it("sends the word trimmed, with all ten lists in their order", () => {
    const form = filled();
    form.content.synonyms = [
      { id: "1", word: "fake" },
      { id: "2", word: "man-made" },
    ] as CategoryItem[];
    const payload = toPayload(form);
    expect(payload.word).toBe("artificial");
    expect(payload.unitId).toBe(2);
    expect(Object.keys(payload)).toEqual(
      expect.arrayContaining([...CONTENT_CATEGORIES]),
    );
    expect(payload.synonyms.map((s) => s.id)).toEqual(["1", "2"]);
    expect(payload.antonyms).toEqual([]);
  });

  it("knows whether there is anything to save", () => {
    const saved = filled();
    expect(isDirty(filled(), saved)).toBe(false);
    const changed = filled();
    changed.content.wordFamily = [{ id: "1", word: "x" }] as CategoryItem[];
    expect(isDirty(changed, saved)).toBe(true);
  });

  it("loads a saved word with its items, and treats a seeded one as empty", () => {
    const detail = {
      id: 1,
      unitId: 2,
      unitTopic: "Travel",
      section: "TOPIC_CONTRAST",
      word: "voyage",
      pronunciation: "",
      partsOfSpeech: [],
      level: null,
      topics: [],
      meaning: "a long journey",
      meaningVi: "",
      example: "",
      contrast: "",
      forms: "",
      pattern: "",
      updatedAt: "",
      categories: {},
      ...Object.fromEntries(CONTENT_CATEGORIES.map((c) => [c, []])),
      collocations: [{ id: "c1", phrase: "a long voyage" }],
    } as unknown as WordDetailFull;
    const form = fromDetail(detail);
    expect(form.basics.level).toBe("");
    expect(form.content.collocations[0].phrase).toBe("a long voyage");
    expect(form.content.synonyms).toEqual([]);
  });
});
