import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import { CodeBlockWithLanguage } from "./CodeBlockWithLanguage";
import { ExitMarkInTable } from "./exitMarkInTable";

/** What the article editor adds on top of the shared editor: images, tables and Shiki-coloured code blocks. */
export const articleExtensions = [
  Image.configure({ inline: false }),
  TableKit.configure({ table: { resizable: false } }),
  CodeBlockWithLanguage,
  // So → steps out of inline code at the end of a table cell, as it does in a paragraph.
  ExitMarkInTable,
];

/** The shared editor's own code block is replaced by the Shiki one above. */
export const articleStarterKit = { codeBlock: false } as const;
