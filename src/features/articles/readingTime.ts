const WORDS_PER_MINUTE = 200;

/** Whole minutes to read `text`, at least 1; the same formula as the backend. */
export function estimateReadingMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

/** The text of an HTML string, without tags. */
export function htmlToText(html: string): string {
  return html
    .replace(/<\/(p|h[1-6]|li|pre|blockquote|tr)>|<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}
