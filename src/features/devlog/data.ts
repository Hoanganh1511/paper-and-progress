import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { cacheLife } from "next/cache";
import { parseDevlogEntry } from "./parseEntry";
import { sortEntries } from "./status";
import type { DevlogEntry } from "./types";

const CONTENT_DIR = path.join(process.cwd(), "content", "devlog");
const ENTRY_FILE = /\.mdx?$/;

/**
 * Every file in `content/devlog/`, newest first. A new entry is just a new
 * file: push it and the next build shows it. Cached, because reading the
 * files cannot happen while a page is prerendered otherwise.
 */
export async function getDevlogEntries(): Promise<DevlogEntry[]> {
  "use cache";
  cacheLife("max");

  const files = (await readdir(CONTENT_DIR)).filter((file) =>
    ENTRY_FILE.test(file),
  );
  const entries = await Promise.all(
    files.map(async (file) =>
      parseDevlogEntry(
        file.replace(ENTRY_FILE, ""),
        await readFile(path.join(CONTENT_DIR, file), "utf8"),
      ),
    ),
  );
  return sortEntries(entries);
}
