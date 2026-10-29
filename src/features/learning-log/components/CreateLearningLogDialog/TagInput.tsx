"use client";

import { useState, type KeyboardEvent } from "react";
import { Badge, Input, Text } from "@/design-system";
import { LIMITS, addTag } from "../../learningLogs";

export interface TagInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  /** The text typed but not yet turned into a tag; the parent needs it to know about unsaved input. */
  draft: string;
  onDraftChange: (draft: string) => void;
}

const REASON_MESSAGES = {
  duplicate: "Tag này đã có.",
  limit: `Tối đa ${LIMITS.tagMax} tag.`,
} as const;

/**
 * Type a tag, press Enter or comma to add it, Backspace in the empty field to
 * take the last one back. Each chip has its own remove button. Rendered inside a
 * FormField, so the field's label and description name the input.
 */
export function TagInput({
  tags,
  onTagsChange,
  draft,
  onDraftChange,
}: TagInputProps) {
  const [message, setMessage] = useState<string>();

  function commit() {
    const result = addTag(tags, draft);
    if (result.ok) {
      onTagsChange(result.tags);
      onDraftChange("");
      setMessage(undefined);
    } else if (result.reason === "empty") {
      onDraftChange("");
    } else {
      setMessage(REASON_MESSAGES[result.reason]);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      // Enter must not submit the form while the user is only adding a tag.
      event.preventDefault();
      commit();
    } else if (event.key === "Backspace" && draft === "" && tags.length > 0) {
      onTagsChange(tags.slice(0, -1));
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Input
        value={draft}
        autoComplete="off"
        placeholder="Nhập tag và nhấn Enter"
        onChange={(event) => {
          // Pasting "a, b" or typing the comma through an IME ends up here too.
          onDraftChange(event.target.value.replace(/,/g, ""));
          setMessage(undefined);
        }}
        onKeyDown={handleKeyDown}
        onBlur={commit}
      />
      {message && (
        <Text as="p" size="body-sm" role="status" className="text-danger-text">
          {message}
        </Text>
      )}
      {tags.length > 0 && (
        <ul aria-label="Tag đã thêm" className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <li key={tag}>
              <Badge
                variant="blue"
                removable
                removeLabel={`Xoá tag ${tag}`}
                onRemove={() => onTagsChange(tags.filter((t) => t !== tag))}
              >
                {`#${tag}`}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
