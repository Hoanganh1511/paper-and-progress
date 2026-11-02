"use client";

import { useState, type KeyboardEvent } from "react";
import { Badge, Button, Input, Text } from "@/design-system";

export interface TagPickerProps {
  value: string[];
  onChange: (tags: string[]) => void;
  /** Existing tags offered as suggestions while typing. */
  suggestions: string[];
  max?: number;
}

/** Type a tag and press Enter or comma; the suggestions are tags that already exist. */
export function TagPicker({
  value,
  onChange,
  suggestions,
  max = 10,
}: TagPickerProps) {
  const [draft, setDraft] = useState("");
  const lower = new Set(value.map((tag) => tag.toLowerCase()));
  const matches = suggestions
    .filter(
      (tag) =>
        !lower.has(tag.toLowerCase()) &&
        draft.trim() &&
        tag.toLowerCase().includes(draft.trim().toLowerCase()),
    )
    .slice(0, 5);

  function add(raw: string) {
    const tag = raw.trim().replace(/,+$/, "").trim();
    if (!tag || value.length >= max) return;
    if (lower.has(tag.toLowerCase())) {
      // Already there: clear the box instead of leaving the text behind.
      setDraft("");
      return;
    }
    onChange([...value, tag]);
    setDraft("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      add(draft);
    } else if (event.key === "Backspace" && !draft && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          value={draft}
          aria-label="Thêm chủ đề"
          placeholder="Gõ chủ đề rồi nhấn Enter"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={value.length >= max}
          className="min-w-0 flex-1"
        />
        <Button
          variant="outline"
          disabled={!draft.trim() || value.length >= max}
          onClick={() => add(draft)}
        >
          Thêm
        </Button>
      </div>
      {matches.length > 0 && (
        <ul aria-label="Gợi ý chủ đề" className="flex flex-wrap gap-1.5">
          {matches.map((tag) => (
            <li key={tag}>
              <button
                type="button"
                onClick={() => add(tag)}
                className="min-h-11 rounded-pill border-2 border-border-strong bg-surface-card px-3 text-body-sm hover:bg-surface-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-border-focus"
              >
                {tag}
              </button>
            </li>
          ))}
        </ul>
      )}
      {value.length > 0 && (
        <ul aria-label="Chủ đề đã chọn" className="flex flex-wrap gap-1.5">
          {value.map((tag) => (
            <li key={tag}>
              <Badge
                removable
                removeLabel={`Bỏ chủ đề ${tag}`}
                onRemove={() => onChange(value.filter((item) => item !== tag))}
              >
                {tag}
              </Badge>
            </li>
          ))}
        </ul>
      )}
      <Text size="caption" color="secondary">
        Tối đa {max} chủ đề.
      </Text>
    </div>
  );
}
