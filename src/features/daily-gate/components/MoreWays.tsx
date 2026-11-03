"use client";

import { useState } from "react";
import { TabList, TabPanel, TabTrigger, Tabs, Text } from "@/design-system";
import { ENTRY_COPY, HELP_KINDS } from "../entryCopy";
import type { EntryKind, WordEntry } from "../types";
import { WordEntryList } from "./WordEntryList";

export interface MoreWaysProps {
  word: string;
  /** What the learner wrote for this word, of every kind. */
  entries: readonly WordEntry[];
  onAdd: (kind: EntryKind, text: string) => Promise<string | undefined>;
  onRemove: (entry: WordEntry) => Promise<string | undefined>;
}

/**
 * The other ways to remember a word, one tab each: collocations, related
 * words, word family, phrasal verbs, patterns, formation, prepositions,
 * synonyms, antonyms and conversations. None is required; a tab shows how many
 * the learner has written, so it is plain which ones are still empty.
 */
export function MoreWays({ word, entries, onAdd, onRemove }: MoreWaysProps) {
  const countOf = (kind: EntryKind) =>
    entries.filter((entry) => entry.kind === kind).length;
  // Open on the first list that has something, or on the first one.
  const [tab, setTab] = useState<EntryKind>(
    HELP_KINDS.find((kind) => countOf(kind) > 0) ?? HELP_KINDS[0],
  );

  return (
    <section
      aria-label={`Các cách học khác cho từ ${word}`}
      className="flex flex-col gap-3 rounded-standard border-2 border-border-strong bg-surface-card p-4"
    >
      <div>
        <Text as="h3" size="body-md" weight="bold">
          Học từ này theo nhiều cách
        </Text>
        <Text size="body-sm" color="secondary">
          Không bắt buộc, nhưng học theo cụm, theo họ từ và theo tình huống sẽ
          nhớ lâu hơn học từ đơn.
        </Text>
      </div>
      <Tabs
        variant="pill"
        value={tab}
        onValueChange={(next) => setTab(next as EntryKind)}
      >
        <TabList aria-label={`Cách học từ ${word}`} className="max-w-full">
          {HELP_KINDS.map((kind) => (
            <TabTrigger key={kind} value={kind}>
              {ENTRY_COPY[kind].title.replace(/ \(collocation\)$/, "")} (
              {countOf(kind)})
            </TabTrigger>
          ))}
        </TabList>
        {HELP_KINDS.map((kind) => (
          <TabPanel key={kind} value={kind} className="flex flex-col gap-3">
            {tab === kind && (
              <WordEntryList
                kind={kind}
                word={word}
                required={0}
                isFolded={false}
                entries={entries.filter((entry) => entry.kind === kind)}
                onAdd={(text) => onAdd(kind, text)}
                onRemove={onRemove}
              />
            )}
          </TabPanel>
        ))}
      </Tabs>
    </section>
  );
}
