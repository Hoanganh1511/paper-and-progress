import { htmlToText } from "./readingTime";

export interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

const HEADING = /<h([23])>([\s\S]*?)<\/h\1>/g;

/** "Mở đầu & kết luận" -> "mo-dau-ket-luan" */
export function headingSlug(text: string): string {
  return (
    text
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "muc"
  );
}

/** Gives each id once; a repeated heading gets -2, -3, ... */
function uniqueIds(texts: string[]): string[] {
  const seen = new Map<string, number>();
  return texts.map((text) => {
    const base = headingSlug(text);
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    return count === 1 ? base : `${base}-${count}`;
  });
}

/** The h2 and h3 headings of sanitized article HTML, in order. */
export function extractToc(html: string): TocItem[] {
  const found = [...html.matchAll(HEADING)].map((match) => ({
    level: Number(match[1]) as 2 | 3,
    text: htmlToText(match[2]).trim(),
  }));
  const ids = uniqueIds(found.map((heading) => heading.text));
  return found.map((heading, index) => ({ ...heading, id: ids[index] }));
}

/** The same HTML with an `id` on each h2 and h3, matching `extractToc`, so the table of contents can link to them. */
export function addHeadingIds(html: string): string {
  const toc = extractToc(html);
  let index = 0;
  return html.replace(HEADING, (_whole, level: string, inner: string) => {
    const id = toc[index]?.id;
    index += 1;
    return `<h${level} id="${id}">${inner}</h${level}>`;
  });
}
