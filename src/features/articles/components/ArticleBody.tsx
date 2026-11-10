import { addHeadingIds } from "../toc";
import { CodeBlockEnhancer } from "./CodeBlockEnhancer";

export interface ArticleBodyProps {
  /** HTML the backend has already sanitized. Never pass anything else here. */
  html: string;
  className?: string;
}

/**
 * The article text. The backend runs `sanitize-html` before it stores the HTML,
 * so it is safe to render as is; `addHeadingIds` only adds `id`s the table of contents links to.
 */
export function ArticleBody({ html, className }: ArticleBodyProps) {
  return (
    <>
      <div
        className={`rich-text text-body-lg ${className ?? ""}`}
        dangerouslySetInnerHTML={{ __html: addHeadingIds(html) }}
      />
      <CodeBlockEnhancer htmlKey={html} />
    </>
  );
}
