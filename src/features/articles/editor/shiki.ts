import { createParser } from "prosemirror-highlight/shiki";
import {
  bundledLanguages,
  createHighlighter,
  type BundledLanguage,
  type HighlighterGeneric,
} from "shiki";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import type { Parser } from "prosemirror-highlight";

/** The same two themes the backend bakes into the saved article, so editor and reader agree. */
const THEMES = { light: "github-light", dark: "github-dark" } as const;

type Highlighter = HighlighterGeneric<
  BundledLanguage,
  "github-light" | "github-dark"
>;

let highlighterPromise: Promise<Highlighter> | undefined;
let highlighter: Highlighter | undefined;

function loadHighlighter() {
  highlighterPromise ??= (
    createHighlighter({
      themes: [THEMES.light, THEMES.dark],
      langs: [],
      // The JavaScript engine skips the ~600 KB WebAssembly one.
      engine: createJavaScriptRegexEngine(),
    }) as Promise<Highlighter>
  ).then((created) => (highlighter = created));
  return highlighterPromise;
}

/** Editor language names Shiki calls something else; unknown ones show as plain text. */
function toShikiLanguage(
  language: string | undefined,
): BundledLanguage | "text" {
  if (!language || language === "plaintext") return "text";
  return language in bundledLanguages ? (language as BundledLanguage) : "text";
}

/**
 * Colours a code block as the reader will. Grammars load on first use, so the first
 * block in a language shows plain for a moment; the parser hands back a promise and
 * the plugin redraws once it resolves.
 */
export const shikiParser: Parser = (options) => {
  const lang = toShikiLanguage(options.language);
  if (!highlighter) {
    return loadHighlighter().then(() => undefined);
  }
  if (lang !== "text" && !highlighter.getLoadedLanguages().includes(lang)) {
    return highlighter.loadLanguage(lang).then(() => undefined);
  }
  return createParser(highlighter, { themes: THEMES, defaultColor: false })({
    ...options,
    language: lang,
  });
};
