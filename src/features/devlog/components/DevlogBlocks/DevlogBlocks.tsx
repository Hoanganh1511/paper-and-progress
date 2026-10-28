import { Text, cn, focusRingClasses } from "@/design-system";
import type { DevlogBlock } from "../../types";

function Block({ block }: { block: DevlogBlock }) {
  switch (block.type) {
    case "paragraph":
      return (
        <Text as="p" size="body-md" color="secondary">
          {block.text}
        </Text>
      );
    case "list":
      return (
        <ul className="m-0 flex list-disc flex-col gap-1 pl-5 font-body text-body-md text-text-secondary">
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    case "code":
      return (
        // Focusable so keyboard users can scroll long lines sideways.
        <pre
          tabIndex={0}
          aria-label={block.language ? `Mã ${block.language}` : "Mã"}
          className={cn(
            "m-0 overflow-x-auto rounded-standard border border-border-subtle bg-surface-sunken p-3 font-mono text-body-sm text-text-primary",
            focusRingClasses,
          )}
        >
          <code>{block.code}</code>
        </pre>
      );
  }
}

export interface DevlogBlocksProps {
  blocks: DevlogBlock[];
}

/** The text of an entry: paragraphs, lists and code snippets, one after another. */
export function DevlogBlocks({ blocks }: DevlogBlocksProps) {
  return blocks.map((block, index) => <Block key={index} block={block} />);
}
