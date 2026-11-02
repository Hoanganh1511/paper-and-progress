import { buildNotesBlock, mergeNotes, syncDailyEnglishLog } from "./diarySync";
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

describe("diary notes", () => {
  it("lists the words marked for review or noted, and nothing else", () => {
    const { block, words } = buildNotesBlock(
      lesson,
      progress({ marks: { 1: "review", 2: "known" } }),
    );
    expect(words).toEqual(["luggage"]);
    expect(block).toContain("• luggage (cần ôn)");
    expect(block).not.toContain("gate");
  });

  it("replaces its own block and keeps the user's text", () => {
    const first = buildNotesBlock(
      lesson,
      progress({ notes: { 2: "a" } }),
    ).block;
    const merged = mergeNotes("Của tôi", first);
    const again = mergeNotes(merged, "");
    expect(merged.startsWith("Của tôi")).toBe(true);
    expect(again).toBe("Của tôi");
  });

  it("writes one log for the day, and marks it completed at the end", () => {
    syncDailyEnglishLog({
      date: "2026-11-02",
      lesson,
      progress: progress({ notes: { 1: "bag" } }),
      isCompleted: false,
    });
    const logs = JSON.parse(
      localStorage.getItem("pp.english-diary.logs") ?? "[]",
    );
    const log = logs.find(
      (l: { id: string }) => l.id === "daily-english-2026-11-02",
    );
    expect(log).toMatchObject({
      skill: "vocabulary",
      status: "draft",
      vocabulary: ["luggage"],
    });
    expect(log.notes).toContain("• luggage: bag");
    syncDailyEnglishLog({
      date: "2026-11-02",
      lesson,
      progress: progress({ notes: { 1: "bag" } }),
      isCompleted: true,
      existing: log,
    });
    const after = JSON.parse(
      localStorage.getItem("pp.english-diary.logs") ?? "[]",
    );
    expect(after.filter((l: { id: string }) => l.id === log.id)).toHaveLength(
      1,
    );
    expect(after.find((l: { id: string }) => l.id === log.id).status).toBe(
      "completed",
    );
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
