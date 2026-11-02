const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&nbsp;": " ",
};

const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** True when the stored text is HTML from the editor, not plain text from before it existed. */
export const isHtml = (value: string) => /^\s*<[a-z!]/i.test(value);

/**
 * What to load into the editor. Plain text (older descriptions) becomes one
 * paragraph per line, so it keeps its line breaks and nothing in it is read as markup.
 */
export function toEditorContent(value: string): string {
  if (!value) return "";
  if (isHtml(value)) return value;
  return value
    .split(/\r?\n/)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join("");
}

/** The text of a stored description without any markup, for a short preview. */
export function toPlainText(value: string | null | undefined): string {
  if (!value) return "";
  if (!isHtml(value)) return value;
  return value
    .replace(/<\/(p|div|h[1-6]|li|blockquote|pre)>/gi, " ")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(
      /&(amp|lt|gt|quot|#39|nbsp);/g,
      (entity) => ENTITIES[entity] ?? entity,
    )
    .replace(/\s+/g, " ")
    .trim();
}
