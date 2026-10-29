import {
  addTag,
  createInitialValues,
  isDirty,
  isHttpUrl,
  latestLogDate,
  logsOnDate,
  normalizeTag,
  toDraft,
  toLocalDateKey,
  totalsForPeriod,
  validateValues,
} from "./learningLogs";
import type { LearningLog, LearningLogFormValues } from "./types";

const valid = (patch: Partial<LearningLogFormValues> = {}) => ({
  ...createInitialValues("2026-10-28"),
  title: "React cơ bản",
  skillId: "programming" as const,
  ...patch,
});

const log = (patch: Partial<LearningLog>): LearningLog => ({
  id: "1",
  title: "t",
  skillId: "programming",
  learningDate: "2026-10-28",
  goal: "",
  notes: "",
  tags: [],
  referenceUrls: [],
  status: "completed",
  createdAt: "2026-10-28T08:00:00.000Z",
  updatedAt: "2026-10-28T08:00:00.000Z",
  ...patch,
});

describe("validateValues", () => {
  it("accepts a form with just a title and a skill", () => {
    expect(validateValues(valid())).toEqual({});
  });

  it("requires the title (3-120 chars) and the skill", () => {
    expect(validateValues(valid({ title: "  " })).title).toMatch(/Nhập/);
    expect(validateValues(valid({ title: "ab" })).title).toMatch(/ít nhất 3/);
    expect(validateValues(valid({ title: "a".repeat(121) })).title).toMatch(
      /tối đa 120/,
    );
    expect(validateValues(valid({ skillId: "" })).skillId).toBeDefined();
  });

  it("limits the goal and the notes", () => {
    expect(validateValues(valid({ goal: "a".repeat(181) })).goal).toBeDefined();
    expect(
      validateValues(valid({ notes: "a".repeat(5001) })).notes,
    ).toBeDefined();
    expect(
      validateValues(valid({ goal: "a".repeat(180), notes: "a".repeat(5000) })),
    ).toEqual({});
  });

  it("accepts an empty reference or an http(s) URL, and rejects the rest", () => {
    expect(validateValues(valid({ referenceUrl: "" }))).toEqual({});
    expect(
      validateValues(valid({ referenceUrl: "https://react.dev" })),
    ).toEqual({});
    for (const bad of ["react.dev", "javascript:alert(1)", "ftp://x.com"]) {
      expect(validateValues(valid({ referenceUrl: bad })).referenceUrl).toBe(
        "Nhập đường dẫn bắt đầu bằng http:// hoặc https://.",
      );
    }
  });
});

describe("tags", () => {
  it("strips # and extra spaces, and caps the length", () => {
    expect(normalizeTag("  ##React  ")).toBe("React");
    expect(normalizeTag("use   state")).toBe("use state");
    expect(normalizeTag("#")).toBe("");
    expect(normalizeTag("a".repeat(50))).toHaveLength(30);
  });

  it("adds a tag, ignoring case duplicates, empties and a full list", () => {
    const first = addTag([], "React");
    expect(first).toEqual({ ok: true, tags: ["React"] });
    expect(addTag(["React"], "#react")).toMatchObject({
      ok: false,
      reason: "duplicate",
    });
    expect(addTag([], "  ")).toMatchObject({ ok: false, reason: "empty" });
    const full = Array.from({ length: 10 }, (_, index) => `t${index}`);
    expect(addTag(full, "extra")).toMatchObject({ ok: false, reason: "limit" });
  });
});

describe("toDraft", () => {
  it("trims text, parses minutes and normalises the URL", () => {
    const draft = toDraft(
      valid({
        title: "  React  ",
        duration: "45",
        referenceUrl: " https://react.dev ",
        tags: ["React"],
      }),
    );
    expect(draft).toMatchObject({
      title: "React",
      durationMinutes: 45,
      referenceUrls: ["https://react.dev/"],
      tags: ["React"],
      skillId: "programming",
    });
  });

  it("leaves optional fields out when empty", () => {
    const draft = toDraft(valid({ duration: "", referenceUrl: "" }));
    expect(draft.durationMinutes).toBeUndefined();
    expect(draft.referenceUrls).toEqual([]);
  });
});

describe("isDirty", () => {
  it("is false for an untouched form and true after any change or a pending tag", () => {
    const initial = createInitialValues("2026-10-28");
    expect(isDirty(initial, initial)).toBe(false);
    expect(isDirty({ ...initial, goal: "x" }, initial)).toBe(true);
    expect(isDirty(initial, initial, "Rea")).toBe(true);
  });
});

describe("dates and totals", () => {
  it("uses the local calendar day", () => {
    expect(toLocalDateKey(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });

  it("finds the newest day and the logs of one day, newest first", () => {
    const logs = [
      log({ id: "a", learningDate: "2026-10-27" }),
      log({
        id: "b",
        learningDate: "2026-10-28",
        createdAt: "2026-10-28T09:00:00.000Z",
      }),
      log({ id: "c", learningDate: "2026-10-28" }),
    ];
    expect(latestLogDate(logs)).toBe("2026-10-28");
    expect(latestLogDate([])).toBeUndefined();
    expect(logsOnDate(logs, "2026-10-28").map((l) => l.id)).toEqual(["b", "c"]);
  });

  it("totals logs and minutes over the last N days, today included", () => {
    const logs = [
      log({ id: "a", learningDate: "2026-10-28", durationMinutes: 30 }),
      log({ id: "b", learningDate: "2026-10-22", durationMinutes: 20 }),
      log({ id: "c", learningDate: "2026-10-21", durationMinutes: 99 }),
      log({ id: "d", learningDate: "2026-10-29" }),
    ];
    // 7 days ending 2026-10-28 are 22..28; the 29th is in the future.
    expect(totalsForPeriod(logs, 7, "2026-10-28")).toEqual({
      logs: 2,
      minutes: 50,
    });
    expect(totalsForPeriod(logs, 30, "2026-10-28").logs).toBe(3);
  });
});

describe("isHttpUrl", () => {
  it("accepts only http and https", () => {
    expect(isHttpUrl("http://a.com")).toBe(true);
    expect(isHttpUrl("https://a.com/x?y=1")).toBe(true);
    expect(isHttpUrl("mailto:a@b.c")).toBe(false);
    expect(isHttpUrl("not a url")).toBe(false);
  });
});
