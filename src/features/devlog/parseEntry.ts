import type { DevlogBlock, DevlogEntry, DevlogStatus } from "./types";

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;
const STATUSES: DevlogStatus[] = ["in_progress", "done"];

function unquote(value: string) {
  const text = value.trim();
  const first = text[0];
  return (first === '"' || first === "'") && text.endsWith(first)
    ? text.slice(1, -1)
    : text;
}

/**
 * Splits `---` front matter from the text below it. Supports the subset the
 * devlog uses: `key: value` lines, quoted strings and `[a, b]` lists.
 */
export function parseFrontmatter(raw: string): {
  data: Record<string, string | string[]>;
  body: string;
} {
  const match = FRONTMATTER.exec(raw);
  if (!match) return { data: {}, body: raw };

  const data: Record<string, string | string[]> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const separator = line.indexOf(":");
    if (separator === -1 || line.trimStart().startsWith("#")) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    data[key] =
      value.startsWith("[") && value.endsWith("]")
        ? value.slice(1, -1).split(",").map(unquote).filter(Boolean)
        : unquote(value);
  }
  return { data, body: match[2] };
}

/** Paragraphs, `-` lists and ``` code fences; blank lines separate blocks. */
export function parseBody(body: string): DevlogBlock[] {
  const blocks: DevlogBlock[] = [];
  const lines = body.split(/\r?\n/);
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (line.trim() === "") {
      index += 1;
    } else if (line.trimStart().startsWith("```")) {
      const language = line.trim().slice(3).trim();
      const code: string[] = [];
      index += 1;
      while (
        index < lines.length &&
        !lines[index].trimStart().startsWith("```")
      ) {
        code.push(lines[index]);
        index += 1;
      }
      index += 1; // the closing fence
      blocks.push({ type: "code", language, code: code.join("\n") });
    } else if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\s*[-*]\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*[-*]\s+/, "").trim());
        index += 1;
      }
      blocks.push({ type: "list", items });
    } else {
      const paragraph: string[] = [];
      while (
        index < lines.length &&
        lines[index].trim() !== "" &&
        !lines[index].trimStart().startsWith("```") &&
        !/^\s*[-*]\s+/.test(lines[index])
      ) {
        paragraph.push(lines[index].trim());
        index += 1;
      }
      blocks.push({ type: "paragraph", text: paragraph.join(" ") });
    }
  }
  return blocks;
}

const text = (value: string | string[] | undefined) =>
  typeof value === "string" && value !== "" ? value : undefined;

/**
 * Turns the text of one devlog file into an entry. Throws a readable error
 * naming the file when a required field is missing or malformed, so a typo
 * in front matter fails the build instead of showing a broken entry.
 */
export function parseDevlogEntry(slug: string, raw: string): DevlogEntry {
  const { data, body } = parseFrontmatter(raw);
  const fail = (message: string): never => {
    throw new Error(`Devlog "${slug}": ${message}`);
  };

  const title = text(data.title) ?? fail("missing `title`");
  const date = text(data.date) ?? fail("missing `date`");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) fail("`date` must be YYYY-MM-DD");
  const moduleId = text(data.module) ?? fail("missing `module`");
  const status = (text(data.status) ??
    fail("missing `status`")) as DevlogStatus;
  if (!STATUSES.includes(status)) fail("`status` must be in_progress or done");

  const progress = Number(data.progress ?? 0);
  if (!Number.isFinite(progress) || progress < 0 || progress > 100) {
    fail("`progress` must be a number from 0 to 100");
  }

  return {
    slug,
    title,
    date,
    module: moduleId,
    status,
    progress,
    tags: Array.isArray(data.tags) ? data.tags : [],
    phase: text(data.phase),
    image: text(data.image),
    imageAlt: text(data.imageAlt),
    body: parseBody(body),
  };
}
