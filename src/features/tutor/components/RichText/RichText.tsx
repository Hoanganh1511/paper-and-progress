import { Fragment, type ReactNode } from "react";

// Double-backtick code (may contain a backtick), single-backtick code, bold.
const TOKEN = /``(.+?)``|`([^`]+)`|\*\*(.+?)\*\*/g;

export interface RichTextProps {
  text: string;
}

/** Renders the tutor's small inline markup: `code` and **bold**. */
export function RichText({ text }: RichTextProps) {
  const parts: ReactNode[] = [];
  let last = 0;

  for (const match of text.matchAll(TOKEN)) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const code = match[1] ?? match[2];
    parts.push(
      code !== undefined ? (
        <code
          key={match.index}
          className="rounded-sharp bg-accent-yellow/30 px-1 font-mono text-[0.9em] break-words"
        >
          {code}
        </code>
      ) : (
        <strong key={match.index} className="font-semibold">
          {match[3]}
        </strong>
      ),
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));

  return (
    <>
      {parts.map((part, index) => (
        <Fragment key={index}>{part}</Fragment>
      ))}
    </>
  );
}
