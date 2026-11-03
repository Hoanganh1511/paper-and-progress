import {
  buildDailyEnglish,
  syncDailyEnglishLog,
  withoutGeneratedNotes,
} from "./diarySync";
import { loadLearnProgress, saveLearnProgress } from "./learnProgress";
import type { LearnResponse } from "./types";

const word = (id: number, text: string) => ({
  id,
  word: text,
  meaning: "",
  example: null,
  contrast: null,
  forms: null,
  pattern: null,
});
const lesson = {
  lessonId: 7,
  unitTopic: "Travel",
  totalWords: 2,
  sections: [
    { type: "VOCABULARY", words: [word(1, "luggage"), word(2, "gate")] },
  ],
} as unknown as LearnResponse;

const progress = (over = {}) => ({
  index: 0,
  visited: [0],
  marks: {},
  notes: {},
  ...over,
});

beforeEach(() => {
  localStorage.clear();
});

describe("learn progress", () => {
  it("brings back what was saved, and starts empty otherwise", () => {
    expect(loadLearnProgress(7).index).toBe(0);
    saveLearnProgress(
      7,
      progress({ index: 2, marks: { 1: "review" }, notes: { 1: "bag" } }),
    );
    expect(loadLearnProgress(7)).toMatchObject({
      index: 2,
      marks: { 1: "review" },
      notes: { 1: "bag" },
    });
    expect(loadLearnProgress(8).index).toBe(0);
  });

  it("ignores damaged storage", () => {
    localStorage.setItem("pp.daily-gate.learn.7", "{oops");
    expect(loadLearnProgress(7).visited).toEqual([0]);
  });
});

const storedLogs = () =>
  JSON.parse(localStorage.getItem("pp.english-diary.logs") ?? "[]");

describe("diary notes", () => {
  it("lists the words marked for review or noted, and nothing else", () => {
    const { data, words } = buildDailyEnglish(
      lesson,
      progress({ marks: { 1: "review", 2: "known" } }),
    );
    expect(words).toEqual(["luggage"]);
    expect(data.words).toEqual([
      expect.objectContaining({ word: "luggage", isReview: true }),
    ]);
  });

  it("keeps the notes the learner wrote, apart from the generated block of older versions", () => {
    const old = [
      "Của tôi",
      "— Ghi chú từ Daily English —",
      "• luggage: bag",
      "— Hết ghi chú Daily English —",
    ].join("\n");
    expect(withoutGeneratedNotes(old)).toBe("Của tôi");
    expect(withoutGeneratedNotes("Chỉ của tôi")).toBe("Chỉ của tôi");
  });

  it("writes one log for the day, and marks it completed at the end", () => {
    syncDailyEnglishLog({
      date: "2026-11-02",
      lesson,
      progress: progress({ notes: { 1: "bag" } }),
      isCompleted: false,
    });
    const log = storedLogs().find(
      (l: { id: string }) => l.id === "daily-english-2026-11-02",
    );
    expect(log).toMatchObject({
      skill: "vocabulary",
      status: "draft",
      vocabulary: ["luggage"],
    });
    expect(log.dailyEnglish.words[0]).toMatchObject({
      word: "luggage",
      note: "bag",
    });
    syncDailyEnglishLog({
      date: "2026-11-02",
      lesson,
      progress: progress({ notes: { 1: "bag" } }),
      isCompleted: true,
      existing: log,
    });
    const after = storedLogs();
    expect(after.filter((l: { id: string }) => l.id === log.id)).toHaveLength(
      1,
    );
    expect(after.find((l: { id: string }) => l.id === log.id).status).toBe(
      "completed",
    );
  });

  it("replaces the old text block in the notes with data, and leaves the learner's own text", () => {
    const old = {
      id: "daily-english-2026-11-02",
      title: "Daily English – Travel",
      skill: "vocabulary" as const,
      date: "2026-11-02",
      goal: "",
      content: "",
      vocabulary: [],
      resources: [],
      tags: [],
      notes:
        "Của tôi\n\n— Ghi chú từ Daily English —\n• luggage: bag\n— Hết ghi chú Daily English —",
      status: "draft" as const,
      isArchived: false,
      createdAt: "2026-11-02T00:00:00.000Z",
    };
    syncDailyEnglishLog({
      date: "2026-11-02",
      lesson,
      progress: progress({ notes: { 1: "bag" } }),
      isCompleted: false,
      existing: old,
    });
    const log = storedLogs().find((l: { id: string }) => l.id === old.id);
    expect(log.notes).toBe("Của tôi");
    expect(log.dailyEnglish.words).toHaveLength(1);
  });

  it("does nothing before there is anything to write", () => {
    syncDailyEnglishLog({
      date: "2026-11-02",
      lesson,
      progress: progress(),
      isCompleted: false,
    });
    expect(localStorage.getItem("pp.english-diary.logs")).toBeNull();
  });
});

describe("buildDailyEnglish with what the learner wrote", () => {
  const entries = {
    1: [
      { id: 1, kind: "SENTENCE" as const, text: "I packed my luggage." },
      { id: 2, kind: "SENTENCE" as const, text: "My luggage is heavy." },
      {
        id: 4,
        kind: "COLLOCATION" as const,
        text: "heavy luggage: hành lý nặng",
      },
      { id: 5, kind: "COLLOCATION" as const, text: "carry-on luggage" },
      { id: 6, kind: "RELATED" as const, text: "baggage (n): hành lý" },
    ],
    2: [{ id: 3, kind: "SENTENCE" as const, text: "The gate is open." }],
  };

  it("keeps each word's sentences, collocations and related words apart, one per item", () => {
    const { data, learned, total, words } = buildDailyEnglish(
      lesson,
      progress(),
      { entries, required: 2 },
    );
    expect(learned).toBe(1);
    expect(total).toBe(2);
    expect(words).toEqual(["luggage", "gate"]);
    expect(data).toEqual({
      learned: 1,
      total: 2,
      words: [
        {
          word: "luggage",
          isLearned: true,
          isKnown: false,
          isReview: false,
          sentences: ["I packed my luggage.", "My luggage is heavy."],
          collocations: ["heavy luggage: hành lý nặng", "carry-on luggage"],
          related: ["baggage (n): hành lý"],
        },
        {
          word: "gate",
          isLearned: false,
          isKnown: false,
          isReview: false,
          sentences: ["The gate is open."],
          collocations: [],
          related: [],
        },
      ],
    });
  });

  it("counts a word marked known as learned, without listing it", () => {
    const { learned, data } = buildDailyEnglish(
      lesson,
      progress({ marks: { 2: "known" } }),
      { entries: {}, required: 2 },
    );
    expect(learned).toBe(1);
    expect(data).toEqual({ learned: 1, total: 2, words: [] });
  });
});

describe("buildDailyEnglish with every kind of entry", () => {
  it("keeps the other categories under their own names, in the order of the tabs", () => {
    const { data } = buildDailyEnglish(lesson, progress(), {
      required: 2,
      entries: {
        1: [
          { id: 1, kind: "SYNONYM", text: "baggage: hành lý" },
          { id: 2, kind: "WORD_FAMILY", text: "luggages (n)" },
          { id: 3, kind: "CONVERSATION", text: "A: hi / B: hello" },
          { id: 4, kind: "SYNONYM", text: "bags" },
        ],
      },
    });
    expect(data.words[0].others).toEqual([
      { label: "Họ từ", items: ["luggages (n)"] },
      { label: "Từ đồng nghĩa", items: ["baggage: hành lý", "bags"] },
      { label: "Hội thoại mẫu", items: ["A: hi / B: hello"] },
    ]);
    // collocations and related words keep their own fields
    expect(data.words[0].collocations).toEqual([]);
  });

  it("leaves the field out when there is nothing else", () => {
    const { data } = buildDailyEnglish(
      lesson,
      progress({ notes: { 1: "bag" } }),
    );
    expect(data.words[0]).not.toHaveProperty("others");
  });
});
