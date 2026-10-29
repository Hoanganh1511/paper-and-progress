import { SEED_LOGS } from "./data";
import {
  duplicateLog,
  filterLogs,
  formatDiaryDate,
  groupLogsByDate,
  sortLogs,
  splitLines,
  splitTags,
  toLocalDateKey,
  toSafeUrl,
} from "./logs";
import type { DiaryLog } from "./types";

const base = SEED_LOGS[0];
const log = (patch: Partial<DiaryLog>): DiaryLog => ({ ...base, ...patch });

describe("filterLogs", () => {
  const logs = [
    log({ id: "a", title: "Podcast", skill: "listening", tags: ["ted"] }),
    log({ id: "b", title: "Essay", skill: "writing", content: "Climate" }),
    log({ id: "c", title: "Old", isArchived: true }),
  ];
  const all = { query: "", skill: "all", isArchived: false } as const;

  it("hides archived logs unless asked", () => {
    expect(
      filterLogs(logs, all)
        .map((l) => l.id)
        .sort(),
    ).toEqual(["a", "b"]);
    expect(
      filterLogs(logs, { ...all, isArchived: true }).map((l) => l.id),
    ).toEqual(["c"]);
  });

  it("filters by skill", () => {
    expect(
      filterLogs(logs, { ...all, skill: "writing" }).map((l) => l.id),
    ).toEqual(["b"]);
  });

  it("searches title, content and tags ignoring case", () => {
    const ids = (query: string) =>
      filterLogs(logs, { ...all, query }).map((l) => l.id);
    expect(ids("PODCAST")).toEqual(["a"]);
    expect(ids("climate")).toEqual(["b"]);
    expect(ids("ted")).toEqual(["a"]);
    expect(ids("nothing")).toEqual([]);
  });
});

describe("sortLogs / groupLogsByDate", () => {
  it("puts the newest day, then the newest log, first", () => {
    const sorted = sortLogs([
      log({ id: "old", date: "2026-10-01" }),
      log({
        id: "new-early",
        date: "2026-10-05",
        createdAt: "2026-10-05T08:00:00Z",
      }),
      log({
        id: "new-late",
        date: "2026-10-05",
        createdAt: "2026-10-05T20:00:00Z",
      }),
    ]);
    expect(sorted.map((l) => l.id)).toEqual(["new-late", "new-early", "old"]);
    expect(groupLogsByDate(sorted).map((g) => [g.date, g.logs.length])).toEqual(
      [
        ["2026-10-05", 2],
        ["2026-10-01", 1],
      ],
    );
  });
});

describe("helpers", () => {
  it("formats dates as dd/mm/yyyy", () => {
    expect(formatDiaryDate("2026-10-27")).toBe("27/10/2026");
  });

  it("uses the local calendar day", () => {
    expect(toLocalDateKey(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });

  it("splits lines and tags, dropping blanks", () => {
    expect(splitLines(" a \n\n b ")).toEqual(["a", "b"]);
    expect(splitTags("x, ,y")).toEqual(["x", "y"]);
  });

  it("duplicates as an unarchived draft dated today", () => {
    const copy = duplicateLog(
      log({ isArchived: true, status: "completed" }),
      "new-id",
      new Date(2026, 9, 29, 10),
    );
    expect(copy).toMatchObject({
      id: "new-id",
      title: "Introduce a Project (bản sao)",
      date: "2026-10-29",
      status: "draft",
      isArchived: false,
    });
  });

  it("links only http(s) references", () => {
    expect(toSafeUrl("https://ted.com/talks")).toBe("https://ted.com/talks");
    expect(toSafeUrl("javascript:alert(1)")).toBeUndefined();
    expect(toSafeUrl("Cambridge book p.12")).toBeUndefined();
  });
});
