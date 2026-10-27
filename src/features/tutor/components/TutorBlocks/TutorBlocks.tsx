"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import {
  Button,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
  cn,
  focusRingClasses,
} from "@/design-system";
import type { TutorBlock } from "../../types";
import { RichText } from "../RichText";

export interface TutorBlocksProps {
  blocks: TutorBlock[];
  checks: Record<string, boolean>;
  onToggleCheck: (id: string, isChecked: boolean) => void;
}

function CodeBlock({ code, filename }: { code: string; filename?: string }) {
  const [isCopied, setIsCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setIsCopied(false), 1500);
    } catch {
      // Clipboard blocked: the code stays selectable in the block.
    }
  }

  return (
    <figure className="overflow-hidden rounded-standard border-2 border-border-strong bg-surface-sunken">
      <figcaption className="flex min-h-11 items-center justify-between gap-2 border-b-2 border-border-strong px-3 py-1">
        <span className="min-w-0 truncate font-mono text-caption text-text-secondary">
          {filename ?? "Code"}
        </span>
        <Button
          size="compact"
          variant="secondary"
          leftIcon={isCopied ? Check : Copy}
          onClick={copy}
        >
          <span aria-live="polite">{isCopied ? "Đã chép" : "Chép"}</span>
        </Button>
      </figcaption>
      {/* Focusable so keyboard users can scroll long lines. */}
      <pre
        tabIndex={0}
        className={cn(
          "overflow-x-auto p-3 font-mono text-body-sm leading-relaxed text-text-primary",
          focusRingClasses,
        )}
      >
        <code>{code}</code>
      </pre>
    </figure>
  );
}

/** Renders the content blocks of one box in a tutor step. */
export function TutorBlocks({
  blocks,
  checks,
  onToggleCheck,
}: TutorBlocksProps) {
  return (
    <>
      {blocks.map((block, index) => {
        switch (block.type) {
          case "heading":
            return (
              <Text
                key={index}
                as="h4"
                size="body-md"
                weight="semibold"
                className="mt-2"
              >
                <RichText text={block.text} />
              </Text>
            );
          case "text":
            return (
              <Text key={index} as="p" className="max-w-[68ch]">
                <RichText text={block.text} />
              </Text>
            );
          case "list": {
            const List = block.ordered ? "ol" : "ul";
            return (
              <List
                key={index}
                className={cn(
                  "flex max-w-[68ch] flex-col gap-1 pl-6 font-body text-body-md leading-relaxed text-text-primary",
                  block.ordered ? "list-decimal" : "list-disc",
                )}
              >
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex}>
                    <RichText text={item} />
                  </li>
                ))}
              </List>
            );
          }
          case "code":
            return (
              <CodeBlock
                key={index}
                code={block.code}
                filename={block.filename}
              />
            );
          case "table":
            return (
              <Table key={index} compact>
                <TableHeader>
                  <TableRow>
                    {block.head.map((cell, cellIndex) => (
                      <TableHead key={cellIndex}>{cell}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {block.rows.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <TableCell key={cellIndex} className="align-top">
                          <RichText text={cell} />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            );
          case "details":
            return (
              <details
                key={index}
                className="flex flex-col gap-3 rounded-standard border-2 border-border-strong bg-surface-page px-3 py-1 open:pb-3"
              >
                <summary
                  className={cn(
                    "min-h-11 cursor-pointer rounded-sharp py-2.5 font-body text-body-md font-semibold",
                    focusRingClasses,
                  )}
                >
                  <RichText text={block.summary} />
                </summary>
                <div className="flex flex-col gap-3">
                  <TutorBlocks
                    blocks={block.content}
                    checks={checks}
                    onToggleCheck={onToggleCheck}
                  />
                </div>
              </details>
            );
          case "check":
            return (
              <Checkbox
                key={block.id}
                checked={checks[block.id] ?? false}
                onChange={(event) =>
                  onToggleCheck(block.id, event.target.checked)
                }
                label={<RichText text={block.text} />}
                className="items-start"
              />
            );
        }
      })}
    </>
  );
}
