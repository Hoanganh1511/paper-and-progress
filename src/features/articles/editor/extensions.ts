import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import { common, createLowlight } from "lowlight";
import { CodeBlockWithLanguage } from "./CodeBlockWithLanguage";
import { ExitMarkInTable } from "./exitMarkInTable";

/** `common` (about 35 languages), not `all`, to keep the editor chunk small. */
const lowlight = createLowlight(common);

/** What the article editor adds on top of the shared editor: images, tables and coloured code blocks. */
export const articleExtensions = [
  Image.configure({ inline: false }),
  TableKit.configure({ table: { resizable: false } }),
  CodeBlockWithLanguage.configure({ lowlight }),
  // So → steps out of inline code at the end of a table cell, as it does in a paragraph.
  ExitMarkInTable,
];

/** The shared editor's own code block is replaced by the lowlight one above. */
export const articleStarterKit = { codeBlock: false } as const;
