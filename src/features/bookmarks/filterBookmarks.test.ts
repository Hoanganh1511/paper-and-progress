import {
  ALL_FOLDERS,
  UNSORTED_FOLDER,
  countByFolder,
  filterBookmarks,
  flattenFolders,
  normalizeSearchText,
  sortBookmarks,
} from "./filterBookmarks";
import { formatSavedAgo } from "./labels";
import type { Bookmark, BookmarkFolder } from "./types";

const NOW = "2026-10-27T12:00:00.000Z";

const bookmark = (overrides: Partial<Bookmark>): Bookmark => ({
  id: "x",
  title: "Bài học",
  description: "",
  href: "/learn",
  folderId: null,
  domain: "it",
  tags: [],
  contentType: "text",
  level: "beginner",
  status: "not-started",
  progress: 0,
  durationMinutes: 10,
  savedAt: NOW,
  ...overrides,
});

const folders: BookmarkFolder[] = [
  { id: "react", label: "React", parentId: null },
  { id: "hooks", label: "Hooks", parentId: "react" },
  { id: "aws", label: "AWS", parentId: null },
];

const daysAgo = (days: number) =>
  new Date(Date.parse(NOW) - days * 86_400_000).toISOString();

const bookmarks: Bookmark[] = [
  bookmark({
    id: "a",
    title: "useState từ đầu",
    folderId: "hooks",
    tags: ["React"],
    progress: 70,
    level: "beginner",
    savedAt: daysAgo(1),
  }),
  bookmark({
    id: "b",
    title: "Next.js App Router",
    folderId: "react",
    tags: ["Next.js"],
    progress: 20,
    level: "advanced",
    savedAt: daysAgo(10),
  }),
  bookmark({
    id: "c",
    title: "Lambda",
    folderId: "aws",
    domain: "it",
    tags: ["AWS"],
    status: "completed",
    progress: 100,
    level: "intermediate",
    savedAt: daysAgo(40),
  }),
  bookmark({
    id: "d",
    title: "Thì hiện tại",
    folderId: null,
    domain: "english",
    contentType: "quiz",
    savedAt: daysAgo(0),
  }),
];

const base = { search: "", folderId: ALL_FOLDERS, filters: {} };
const ids = (list: Bookmark[]) => list.map((b) => b.id);

describe("filterBookmarks", () => {
  it("returns everything with no folder, search or filter", () => {
    expect(ids(filterBookmarks(bookmarks, folders, base, NOW))).toEqual([
      "a",
      "b",
      "c",
      "d",
    ]);
  });

  it("shows a folder together with its sub-folders", () => {
    const inReact = filterBookmarks(
      bookmarks,
      folders,
      { ...base, folderId: "react" },
      NOW,
    );
    expect(ids(inReact)).toEqual(["a", "b"]);
  });

  it("shows only unsorted bookmarks in the unsorted view", () => {
    const unsorted = filterBookmarks(
      bookmarks,
      folders,
      { ...base, folderId: UNSORTED_FOLDER },
      NOW,
    );
    expect(ids(unsorted)).toEqual(["d"]);
  });

  it("searches title and tags without regard to accents or case", () => {
    const byTitle = filterBookmarks(
      bookmarks,
      folders,
      { ...base, search: "thi hien tai" },
      NOW,
    );
    expect(ids(byTitle)).toEqual(["d"]);
    const byTag = filterBookmarks(
      bookmarks,
      folders,
      { ...base, search: "AWS" },
      NOW,
    );
    expect(ids(byTag)).toEqual(["c"]);
  });

  it("combines groups with AND and options within a group with OR", () => {
    const result = filterBookmarks(
      bookmarks,
      folders,
      {
        ...base,
        filters: {
          domain: ["it"],
          level: ["beginner", "advanced"],
        },
      },
      NOW,
    );
    expect(ids(result)).toEqual(["a", "b"]);
  });

  it("filters by status, type and tag", () => {
    const run = (filters: Record<string, string[]>) =>
      ids(filterBookmarks(bookmarks, folders, { ...base, filters }, NOW));
    expect(run({ status: ["completed"] })).toEqual(["c"]);
    expect(run({ type: ["quiz"] })).toEqual(["d"]);
    expect(run({ tag: ["React", "AWS"] })).toEqual(["a", "c"]);
  });

  it("filters by when it was saved", () => {
    const run = (saved: string) =>
      ids(
        filterBookmarks(
          bookmarks,
          folders,
          { ...base, filters: { saved: [saved] } },
          NOW,
        ),
      );
    expect(run("today")).toEqual(["d"]);
    expect(run("week")).toEqual(["a", "d"]);
    expect(run("month")).toEqual(["a", "b", "d"]);
  });
});

describe("sortBookmarks", () => {
  it("sorts by saved time, newest first or oldest first", () => {
    expect(
      ids(sortBookmarks(bookmarks, { key: "savedAt", direction: "desc" })),
    ).toEqual(["d", "a", "b", "c"]);
    expect(
      ids(sortBookmarks(bookmarks, { key: "savedAt", direction: "asc" })),
    ).toEqual(["c", "b", "a", "d"]);
  });

  it("sorts titles alphabetically", () => {
    expect(
      ids(sortBookmarks(bookmarks, { key: "title", direction: "asc" })),
    ).toEqual(["c", "b", "d", "a"]);
  });

  it("sorts by progress and by level order", () => {
    expect(
      ids(sortBookmarks(bookmarks, { key: "progress", direction: "desc" })),
    ).toEqual(["c", "a", "b", "d"]);
    expect(
      ids(sortBookmarks(bookmarks, { key: "level", direction: "desc" })),
    ).toEqual(["b", "c", "a", "d"]);
  });

  it("does not change the list it is given", () => {
    const copy = [...bookmarks];
    sortBookmarks(bookmarks, { key: "title", direction: "desc" });
    expect(bookmarks).toEqual(copy);
  });
});

describe("folders", () => {
  it("counts bookmarks per folder, parents including their children", () => {
    expect(countByFolder(bookmarks, folders)).toEqual({
      [ALL_FOLDERS]: 4,
      [UNSORTED_FOLDER]: 1,
      react: 2,
      hooks: 1,
      aws: 1,
    });
  });

  it("flattens the tree in order with a readable path", () => {
    expect(flattenFolders(folders).map((f) => f.path)).toEqual([
      "React",
      "React / Hooks",
      "AWS",
    ]);
  });
});

describe("text helpers", () => {
  it("strips accents, including đ", () => {
    expect(normalizeSearchText("Đang học Tiến độ")).toBe("dang hoc tien do");
  });

  it("says how long ago something was saved", () => {
    expect(formatSavedAgo(NOW, NOW)).toBe("Vừa xong");
    expect(formatSavedAgo(daysAgo(2), NOW)).toBe("2 ngày trước");
    expect(
      formatSavedAgo(
        new Date(Date.parse(NOW) - 3 * 3_600_000).toISOString(),
        NOW,
      ),
    ).toBe("3 giờ trước");
    expect(formatSavedAgo(daysAgo(65), NOW)).toBe("2 tháng trước");
  });
});
