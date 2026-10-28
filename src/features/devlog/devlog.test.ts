import { buildRssFeed, escapeXml } from "./rss";
import { parseBody, parseDevlogEntry, parseFrontmatter } from "./parseEntry";
import {
  computePeriodProgress,
  computeProjectStatus,
  computeProjectSummaries,
  filterEntries,
  formatDevlogDate,
  sortEntries,
  toCustomProjectId,
} from "./status";
import type { DevlogEntry } from "./types";

const RAW = `---
title: "Auth System — Phase 1"
date: 2026-10-27
tags: [security, backend]
module: auth
status: in_progress
progress: 15
phase: 1/6
---

Hoàn thành JWT + refresh token
rotation.

- Argon2id hashing
- Rotation

\`\`\`ts
const a = 1;
\`\`\`
`;

const entry = (overrides: Partial<DevlogEntry>): DevlogEntry => ({
  slug: "2026-10-27-a",
  title: "A",
  date: "2026-10-27",
  tags: [],
  module: "design-system",
  status: "done",
  progress: 10,
  body: [],
  ...overrides,
});

describe("parseFrontmatter", () => {
  it("reads strings, quoted strings and lists", () => {
    const { data, body } = parseFrontmatter(RAW);
    expect(data.title).toBe("Auth System — Phase 1");
    expect(data.date).toBe("2026-10-27");
    expect(data.tags).toEqual(["security", "backend"]);
    expect(body.startsWith("\nHoàn thành")).toBe(true);
  });

  it("returns the whole text as body without front matter", () => {
    expect(parseFrontmatter("Chỉ có nội dung")).toEqual({
      data: {},
      body: "Chỉ có nội dung",
    });
  });
});

describe("parseBody", () => {
  it("makes paragraphs, lists and code blocks", () => {
    const { body } = parseFrontmatter(RAW);
    expect(parseBody(body)).toEqual([
      { type: "paragraph", text: "Hoàn thành JWT + refresh token rotation." },
      { type: "list", items: ["Argon2id hashing", "Rotation"] },
      { type: "code", language: "ts", code: "const a = 1;" },
    ]);
  });
});

describe("parseDevlogEntry", () => {
  it("builds an entry from a file", () => {
    expect(parseDevlogEntry("2026-10-27-auth", RAW)).toMatchObject({
      slug: "2026-10-27-auth",
      title: "Auth System — Phase 1",
      date: "2026-10-27",
      module: "auth",
      status: "in_progress",
      progress: 15,
      phase: "1/6",
      tags: ["security", "backend"],
    });
  });

  it("names the file when something is wrong", () => {
    expect(() => parseDevlogEntry("x", "---\ndate: 2026-10-27\n---\n")).toThrow(
      'Devlog "x": missing `title`',
    );
    expect(() =>
      parseDevlogEntry(
        "x",
        "---\ntitle: T\ndate: 27/10/2026\nmodule: m\nstatus: done\n---\n",
      ),
    ).toThrow("`date` must be YYYY-MM-DD");
    expect(() =>
      parseDevlogEntry(
        "x",
        "---\ntitle: T\ndate: 2026-10-27\nmodule: m\nstatus: wip\n---\n",
      ),
    ).toThrow("`status` must be in_progress or done");
    expect(() =>
      parseDevlogEntry(
        "x",
        "---\ntitle: T\ndate: 2026-10-27\nmodule: m\nstatus: done\nprogress: 140\n---\n",
      ),
    ).toThrow("`progress` must be a number from 0 to 100");
  });
});

describe("project status", () => {
  const entries = [
    entry({ slug: "2026-10-25-a", date: "2026-10-25", progress: 5 }),
    entry({ slug: "2026-10-26-a", date: "2026-10-26", progress: 20 }),
    entry({ slug: "2026-10-27-a", date: "2026-10-27", progress: 30 }),
    entry({
      slug: "2026-10-27-b",
      date: "2026-10-27",
      module: "content",
      progress: 40,
    }),
    entry({ slug: "2026-10-20-a", date: "2026-10-20", progress: 1 }),
  ];

  it("sorts newest first, the later file name winning a tie", () => {
    expect(sortEntries(entries).map((e) => e.slug)).toEqual([
      "2026-10-27-b",
      "2026-10-27-a",
      "2026-10-26-a",
      "2026-10-25-a",
      "2026-10-20-a",
    ]);
  });

  it("takes each module's progress from its newest entry", () => {
    const status = computeProjectStatus(entries);
    expect(status.modules).toEqual([
      { id: "design-system", label: "Design System", progress: 30 },
      { id: "content", label: "Content Pages", progress: 40 },
      { id: "auth", label: "Auth & Security", progress: 0 },
      { id: "database", label: "Database", progress: 0 },
    ]);
    expect(status.overall).toBe(18);
  });

  it("counts days in a row back from the newest entry", () => {
    const status = computeProjectStatus(entries);
    expect(status.streak).toBe(3);
    expect(status.entryCount).toBe(5);
    expect(status.startedAt).toBe("2026-10-20");
  });

  it("copes with no entries", () => {
    expect(computeProjectStatus([])).toMatchObject({
      overall: 0,
      streak: 0,
      entryCount: 0,
      startedAt: null,
    });
  });

  it("formats dates as day/month/year", () => {
    expect(formatDevlogDate("2026-10-27")).toBe("27/10/2026");
  });
});

describe("filterEntries", () => {
  const entries = [
    entry({ slug: "a", module: "auth", tags: ["security", "backend"] }),
    entry({ slug: "b", module: "design-system", tags: ["frontend"] }),
    entry({ slug: "c", module: "auth", tags: ["frontend"] }),
  ];
  const slugs = (list: DevlogEntry[]) => list.map((e) => e.slug);

  it("returns all without filters", () => {
    expect(slugs(filterEntries(entries, {}))).toEqual(["a", "b", "c"]);
  });

  it("matches a module, any tag, or both", () => {
    expect(slugs(filterEntries(entries, { module: ["auth"] }))).toEqual([
      "a",
      "c",
    ]);
    expect(
      slugs(filterEntries(entries, { tag: ["security", "frontend"] })),
    ).toEqual(["a", "b", "c"]);
    expect(
      slugs(filterEntries(entries, { module: ["auth"], tag: ["frontend"] })),
    ).toEqual(["c"]);
  });

  it("matches a status", () => {
    const withStatus = [
      entry({ slug: "a", status: "done" }),
      entry({ slug: "b", status: "in_progress" }),
    ];
    expect(slugs(filterEntries(withStatus, { status: ["done"] }))).toEqual([
      "a",
    ]);
  });

  it("searches title, text, tags and module name, requiring every word", () => {
    const searchable = [
      entry({
        slug: "a",
        title: "Auth System",
        module: "auth",
        tags: ["security"],
        body: [{ type: "paragraph", text: "Refresh token rotation" }],
      }),
      entry({ slug: "b", title: "Text Primitive", module: "design-system" }),
    ];
    expect(slugs(filterEntries(searchable, { query: "TOKEN" }))).toEqual(["a"]);
    expect(slugs(filterEntries(searchable, { query: "#" }))).toEqual([]);
    expect(
      slugs(filterEntries(searchable, { query: "security auth" })),
    ).toEqual(["a"]);
    expect(slugs(filterEntries(searchable, { query: "design" }))).toEqual([
      "b",
    ]);
    expect(
      slugs(filterEntries(searchable, { query: "token primitive" })),
    ).toEqual([]);
    expect(slugs(filterEntries(searchable, { query: "  " }))).toEqual([
      "a",
      "b",
    ]);
  });
});

describe("buildRssFeed", () => {
  it("escapes markup", () => {
    expect(escapeXml(`<a href="x">&'</a>`)).toBe(
      "&lt;a href=&quot;x&quot;&gt;&amp;&apos;&lt;/a&gt;",
    );
  });

  it("lists each entry with a link to its anchor", () => {
    const xml = buildRssFeed(
      [
        entry({
          slug: "2026-10-27-a",
          title: "Tom & Jerry",
          tags: ["x"],
          body: [{ type: "paragraph", text: "Nội dung" }],
        }),
      ],
      {
        title: "Devlog",
        description: "Mô tả",
        siteUrl: "https://example.com",
        pagePath: "/devlog",
      },
    );
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain("<title>Tom &amp; Jerry</title>");
    expect(xml).toContain(
      "<link>https://example.com/devlog?entry=2026-10-27-a</link>",
    );
    expect(xml).toContain("<pubDate>Tue, 27 Oct 2026 00:00:00 GMT</pubDate>");
    expect(xml).toContain("<category>x</category>");
    expect(xml).toContain("<description>Nội dung</description>");
  });
});

describe("computeProjectSummaries", () => {
  const entries = [
    entry({
      slug: "a",
      module: "auth",
      date: "2026-10-25",
      status: "done",
      progress: 10,
    }),
    entry({
      slug: "b",
      module: "auth",
      date: "2026-10-27",
      status: "in_progress",
      progress: 30,
    }),
    entry({
      slug: "c",
      module: "database",
      date: "2026-10-26",
      status: "done",
      progress: 5,
    }),
  ];
  const projects = [
    { id: "auth", label: "Auth" },
    { id: "database", label: "Database" },
    { id: "custom-blog", label: "Blog" },
  ];

  it("counts logs and statuses, and takes progress and date from the newest log", () => {
    const [auth, database, blog] = computeProjectSummaries(entries, projects);
    expect(auth).toMatchObject({
      entryCount: 2,
      doneCount: 1,
      inProgressCount: 1,
      progress: 30,
      lastEntryAt: "2026-10-27",
    });
    expect(database).toMatchObject({
      entryCount: 1,
      doneCount: 1,
      progress: 5,
    });
    expect(blog).toMatchObject({
      entryCount: 0,
      progress: 0,
      lastEntryAt: null,
    });
  });
});

describe("toCustomProjectId", () => {
  it("makes a prefixed ascii slug", () => {
    expect(toCustomProjectId("Blog cá nhân")).toBe("custom-blog-ca-nhan");
    expect(toCustomProjectId("Đồ án 2026!")).toBe("custom-do-an-2026");
    expect(toCustomProjectId("???")).toBe("custom-project");
  });
});

describe("computePeriodProgress", () => {
  const entries = [
    entry({ slug: "a", module: "auth", date: "2026-10-27", progress: 40 }),
    entry({ slug: "b", module: "auth", date: "2026-10-20", progress: 25 }),
    entry({ slug: "c", module: "auth", date: "2026-10-01", progress: 10 }),
    entry({ slug: "d", module: "database", date: "2026-10-02", progress: 50 }),
  ];
  const byId = (period: ReturnType<typeof computePeriodProgress>, id: string) =>
    period.modules.find((module) => module.id === id)!;

  it("counts back from the newest entry, not from the clock", () => {
    expect(computePeriodProgress(entries, 7).endsAt).toBe("2026-10-27");
    expect(computePeriodProgress([], 7)).toMatchObject({
      endsAt: null,
      totalGained: 0,
      totalEntries: 0,
    });
  });

  it("gains the difference from the module's last entry before the period", () => {
    const week = computePeriodProgress(entries, 7);
    // 27/10 back 7 days starts 21/10: only "a" is in; "b" (25) is the baseline.
    expect(byId(week, "auth")).toMatchObject({
      progress: 40,
      gained: 15,
      entryCount: 1,
    });
    const month = computePeriodProgress(entries, 30);
    // Everything is inside the month, so the baseline is zero.
    expect(byId(month, "auth")).toMatchObject({ gained: 40, entryCount: 3 });
    expect(month.totalEntries).toBe(4);
  });

  it("gains nothing in a module with no entry in the period", () => {
    const week = computePeriodProgress(entries, 7);
    expect(byId(week, "database")).toMatchObject({
      progress: 50,
      gained: 0,
      entryCount: 0,
    });
    expect(week.totalGained).toBe(15);
  });
});
