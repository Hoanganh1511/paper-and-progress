"use client";

import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from "@tiptap/react";

/** Languages offered for a code block: value is the lowlight name, saved as `language-<value>`. */
export const CODE_LANGUAGES = [
  { value: "bash", label: "Bash / Shell" },
  { value: "c", label: "C" },
  { value: "cpp", label: "C++" },
  { value: "csharp", label: "C#" },
  { value: "css", label: "CSS" },
  { value: "diff", label: "Diff" },
  { value: "go", label: "Go" },
  { value: "graphql", label: "GraphQL" },
  { value: "xml", label: "HTML / XML" },
  { value: "java", label: "Java" },
  { value: "javascript", label: "JavaScript" },
  { value: "json", label: "JSON" },
  { value: "kotlin", label: "Kotlin" },
  { value: "markdown", label: "Markdown" },
  { value: "php", label: "PHP" },
  { value: "python", label: "Python" },
  { value: "ruby", label: "Ruby" },
  { value: "rust", label: "Rust" },
  { value: "sql", label: "SQL" },
  { value: "swift", label: "Swift" },
  { value: "typescript", label: "TypeScript" },
  { value: "yaml", label: "YAML" },
  { value: "plaintext", label: "Văn bản thường" },
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
        className="absolute top-2 right-2 z-[1] h-8 max-w-40 cursor-pointer rounded-sharp border-2 border-border-strong bg-surface-card px-1.5 font-sans text-xs font-semibold text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-border-focus"
      >
        <option value="">Tự nhận diện</option>
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

/** The lowlight code block, drawn with the language picker inside it. */
export const CodeBlockWithLanguage = CodeBlockLowlight.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockView);
  },
});
