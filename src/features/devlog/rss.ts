import type { DevlogBlock, DevlogEntry } from "./types";

const ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
};

export const escapeXml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ESCAPES[char]);

function blockToText(block: DevlogBlock) {
  switch (block.type) {
    case "paragraph":
      return block.text;
    case "list":
      return block.items.map((item) => `- ${item}`).join("\n");
    case "code":
      return block.code;
  }
}

export interface RssOptions {
  title: string;
  description: string;
  /** Site address without a trailing slash, e.g. `https://example.com`. */
  siteUrl: string;
  /** Path of the page the feed describes, e.g. `/devlog`. */
  pagePath: string;
}

/** An RSS 2.0 feed of the entries, newest first as given. */
export function buildRssFeed(entries: DevlogEntry[], options: RssOptions) {
  const pageUrl = `${options.siteUrl}${options.pagePath}`;
  const items = entries
    .map((entry) => {
      const url = `${pageUrl}#${entry.slug}`;
      return [
        "    <item>",
        `      <title>${escapeXml(entry.title)}</title>`,
        `      <link>${escapeXml(url)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(url)}</guid>`,
        `      <pubDate>${new Date(`${entry.date}T00:00:00Z`).toUTCString()}</pubDate>`,
        `      <description>${escapeXml(entry.body.map(blockToText).join("\n\n"))}</description>`,
        ...entry.tags.map(
          (tag) => `      <category>${escapeXml(tag)}</category>`,
        ),
        "    </item>",
      ].join("\n");
    })
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    "  <channel>",
    `    <title>${escapeXml(options.title)}</title>`,
    `    <link>${escapeXml(pageUrl)}</link>`,
    `    <description>${escapeXml(options.description)}</description>`,
    "    <language>vi</language>",
    items,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");
}
