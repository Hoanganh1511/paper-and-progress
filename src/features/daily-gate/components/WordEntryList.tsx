"use client";

import { useId, useState, type FormEvent } from "react";
import { Check, Trash2 } from "lucide-react";
import { Alert, Button, FormField, Input, Text } from "@/design-system";
import { ENTRY_COPY } from "../entryCopy";
import { containsPhrase } from "../phraseMatcher";
import type { EntryKind, WordEntry } from "../types";
import { SentenceCheck } from "./SentenceCheck";

export interface WordEntryListProps {
  kind: EntryKind;
  word: string;
  /** Entries needed before the word counts as learned; 0 when the list is only a help. */
  required: number;
  entries: readonly WordEntry[];
  /** Resolves to an error message, or undefined once saved. */
  onAdd: (text: string) => Promise<string | undefined>;
  onRemove: (entry: WordEntry) => Promise<string | undefined>;
  /** A help list folds into a closed panel by default; a tab that already names it shows it open. */
  isFolded?: boolean;
}

/**
 * One way to remember a word: write sentences with it, the phrases it keeps
 * company with, or the words related to it. Sentences are required (with
 * `required` of them the word counts as learned); the others fold away and
 * are there to help.
 */
export function WordEntryList({
  kind,
  word,
  required,
  entries,
  onAdd,
  onRemove,
  isFolded = true,
}: WordEntryListProps) {
  const copy = ENTRY_COPY[kind];
  const [text, setText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>();
  const headingId = useId();
  const isRequired = required > 0;
  const isDone = isRequired && entries.length >= required;
  const canAdd = !isRequired || entries.length < required;

  // Enter in the field adds the entry at once: one line, one entry.
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving || !text.trim()) return;
    if (copy.needsWord && !containsPhrase(word, text)) {
      setError(
        `Chưa thấy “${word}” trong ${copy.label}. Có thể chia động từ hoặc đổi “a/the”.`,
      );
      return;
    }
    setIsSaving(true);
    setError(undefined);
    const message = await onAdd(text.trim());
    if (message) setError(message);
    else setText("");
    setIsSaving(false);
  }

  async function handleRemove(entry: WordEntry) {
    setError(await onRemove(entry));
  }

  const body = (
    <>
      {entries.length > 0 && (
        <ul className="flex flex-col gap-2">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="flex items-start justify-between gap-2"
            >
              <Text size="body-sm" lang="en">
                {entry.text}
              </Text>
              <Button
                size="compact"
                variant="ghost"
                leftIcon={Trash2}
                aria-label={`Xoá ${copy.label}: ${entry.text}`}
                onClick={() => handleRemove(entry)}
              />
            </li>
          ))}
        </ul>
      )}

      {canAdd && (
        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-3"
        >
          <FormField
            label={
              isRequired
                ? `Câu thứ ${entries.length + 1} với “${word}”`
                : `Thêm ${copy.label} cho “${word}”`
            }
            description={copy.description}
          >
            <Input
              lang="en"
              autoComplete="off"
              enterKeyHint="done"
              placeholder={copy.placeholder}
              value={text}
              onChange={(event) => {
                setText(event.target.value);
                setError(undefined);
              }}
            />
          </FormField>
          {copy.needsWord && <SentenceCheck phrase={word} sentence={text} />}
          <div className="flex justify-end">
            <Button
              type="submit"
              variant="accent"
              size="compact"
              isLoading={isSaving}
              disabled={isSaving}
            >
              {isRequired ? "Lưu câu" : `Lưu ${copy.label}`}
            </Button>
          </div>
        </form>
      )}
      {error && <Alert variant="danger">{error}</Alert>}
    </>
  );

  // Inside a tab that already names it, the list is shown as it is.
  if (!isRequired && !isFolded) {
    return <div className="flex flex-col gap-3">{body}</div>;
  }

  if (!isRequired) {
    return (
      <details className="rounded-standard border-2 border-border-strong bg-surface-card p-4">
        <summary className="min-h-11 cursor-pointer font-semibold">
          {copy.title} ({entries.length})
        </summary>
        <div className="mt-3 flex flex-col gap-3">{body}</div>
      </details>
    );
  }

  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-3 rounded-standard border-2 border-border-strong bg-surface-card p-4"
    >
      <Text
        as="h3"
        id={headingId}
        size="body-md"
        weight="bold"
        className="flex items-center gap-2"
      >
        {isDone && <Check aria-hidden="true" size={18} />}
        {copy.title}: {Math.min(entries.length, required)} / {required}
        {isDone && <span className="text-body-sm">· Đã đủ câu</span>}
      </Text>
      {body}
    </section>
  );
}
