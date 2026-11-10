"use client";

import { CodeBlock } from "@tiptap/extension-code-block";
import { createHighlightPlugin } from "prosemirror-highlight";
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from "@tiptap/react";
import { shikiParser } from "./shiki";

/** Languages offered for a code block: value is the Shiki name, saved as `language-<value>`. */
export const CODE_LANGUAGES = [
  { value: "astro", label: "Astro" },
  { value: "bash", label: "Bash / Shell" },
  { value: "c", label: "C" },
  { value: "cpp", label: "C++" },
  { value: "csharp", label: "C#" },
  { value: "css", label: "CSS" },
  { value: "diff", label: "Diff" },
  { value: "dockerfile", label: "Dockerfile" },
  { value: "go", label: "Go" },
  { value: "graphql", label: "GraphQL" },
  { value: "html", label: "HTML" },
  { value: "java", label: "Java" },
  { value: "javascript", label: "JavaScript" },
  { value: "json", label: "JSON" },
  { value: "jsx", label: "JSX (React)" },
  { value: "kotlin", label: "Kotlin" },
  { value: "less", label: "Less" },
  { value: "markdown", label: "Markdown" },
  { value: "php", label: "PHP" },
  { value: "python", label: "Python" },
  { value: "ruby", label: "Ruby" },
  { value: "rust", label: "Rust" },
  { value: "scss", label: "SCSS" },
  { value: "sql", label: "SQL" },
  { value: "svelte", label: "Svelte" },
  { value: "swift", label: "Swift" },
  { value: "toml", label: "TOML" },
  { value: "tsx", label: "TSX (React)" },
  { value: "typescript", label: "TypeScript" },
  { value: "vue", label: "Vue" },
  { value: "xml", label: "XML" },
  { value: "yaml", label: "YAML" },
] as const;

/** A code block with the language picker in its top-right corner. */
function CodeBlockView({ node, updateAttributes }: NodeViewProps) {
  const language = (node.attrs.language as string | null) ?? "";
  return (
    <NodeViewWrapper className="relative">
      <select
        contentEditable={false}
        aria-label="Ngôn ngữ của khối mã"
        title="Ngôn ngữ của khối mã"
        value={language}
        onChange={(event) =>
          updateAttributes({ language: event.target.value || null })
        }
        className="absolute top-2 right-2 z-[1] h-8 max-w-40 cursor-pointer rounded-sharp border border-border-subtle bg-surface-card px-1.5 font-sans text-[14px] text-text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-border-focus"
      >
        <option value="">Văn bản thường</option>
        {/* A language that is not in the list (e.g. pasted) stays selectable. */}
        {language !== "" &&
          !CODE_LANGUAGES.some((item) => item.value === language) && (
            <option value={language}>{language}</option>
          )}
        {CODE_LANGUAGES.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
      <pre className="pt-12">
        <NodeViewContent<"code"> as="code" />
      </pre>
    </NodeViewWrapper>
  );
}

/** The code block, coloured by Shiki as the reader will show it, drawn with the language picker inside it. */
export const CodeBlockWithLanguage = CodeBlock.extend({
  addProseMirrorPlugins() {
    return [
      ...(this.parent?.() ?? []),
      createHighlightPlugin({ parser: shikiParser, nodeTypes: [this.name] }),
    ];
  },
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockView);
  },
});
