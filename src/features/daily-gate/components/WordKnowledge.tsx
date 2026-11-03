"use client";

import { useState, type ReactNode } from "react";
import {
  Badge,
  TabList,
  TabPanel,
  TabTrigger,
  Tabs,
  Text,
} from "@/design-system";
import {
  CATEGORIES,
  PART_OF_SPEECH_OPTIONS,
  type CategoryConfig,
} from "@/features/vocabulary-admin/categories";
import type {
  CategoryItem,
  ContentCategory,
} from "@/features/vocabulary-admin/types";
import type { LearnWord } from "../types";

const partName = (value: string) =>
  PART_OF_SPEECH_OPTIONS.find((option) => option.value === value)?.label ??
  value;

/** What kind of word it is: how to say it, its parts of speech, level and Vietnamese meaning. */
function WordInfo({ word }: { word: LearnWord }) {
  const parts = word.partsOfSpeech ?? [];
  const hasInfo =
    word.pronunciation || parts.length > 0 || word.level || word.meaningVi;
  if (!hasInfo) return null;
  return (
    <div className="flex flex-col gap-2 rounded-standard border-2 border-border-strong bg-surface-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        {word.pronunciation && (
          <Text as="span" lang="en" weight="semibold" className="font-display">
            {word.pronunciation}
          </Text>
        )}
        {word.level && (
          <Badge variant="blue" size="sm">
            {word.level}
          </Badge>
        )}
        {parts.map((part) => (
          <Badge key={part} size="sm">
            {partName(part)}
          </Badge>
        ))}
      </div>
      {word.meaningVi && <Text>{word.meaningVi}</Text>}
    </div>
  );
}

/** The words to bold in a line: "artificial, artificially" (commas or semicolons). */
function highlighted(text: string, terms: string): ReactNode {
  const list = terms
    .split(/[,;]/)
    .map((term) => term.trim())
    .filter(Boolean);
  if (list.length === 0) return text;
  // The longer word first, or "artificial" would take the front of "artificially".
  const escaped = [...list]
    .sort((a, b) => b.length - a.length)
    .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const parts = text.split(new RegExp(`(${escaped.join("|")})`, "gi"));
  return parts.map((part, index) =>
    list.some((term) => term.toLowerCase() === part.toLowerCase()) ? (
      <mark
        key={index}
        className="rounded-sharp bg-accent-lime px-0.5 font-semibold text-ink"
      >
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

/** A dialogue: who says what, then the Vietnamese, with the target word marked. */
function Conversation({ item }: { item: CategoryItem }) {
  const line = (role: string, fallback: string, text: string) => (
    <p lang="en">
      <span className="font-semibold">{role || fallback}:</span>{" "}
      {highlighted(text, item.highlight ?? "")}
    </p>
  );
  return (
    <div className="flex flex-col gap-1.5">
      {item.situation && (
        <Text weight="bold" className="font-display">
          {item.situation}
        </Text>
      )}
      {item.speakerA && line(item.speakerARole, "A", item.speakerA)}
      {item.speakerB && line(item.speakerBRole, "B", item.speakerB)}
      {item.translationVi && (
        <Text size="body-sm" color="secondary" className="italic">
          {item.translationVi}
        </Text>
      )}
    </div>
  );
}

/** One item, laid out from its category's own fields: the title, then the choices as badges, then the texts. */
function ItemView({
  category,
  item,
}: {
  category: CategoryConfig;
  item: CategoryItem;
}) {
  if (category.key === "conversations") return <Conversation item={item} />;
  const title = category.titleOf(item)?.trim();
  const badges: string[] = [];
  const lines: { label: string; value: string; isExample: boolean }[] = [];
  for (const field of category.fields) {
    const value = (item[field.key] ?? "").trim();
    if (!value) continue;
    if (field.kind === "select") {
      const label = field.options?.find((o) => o.value === value)?.label;
      if (label) badges.push(label);
    } else if (!(field.required && title.includes(value))) {
      lines.push({
        label: field.label,
        value,
        isExample: field.key === "example",
      });
    }
  }
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <Text as="span" lang="en" weight="bold" className="font-display">
          {title}
        </Text>
        {badges.map((label) => (
          <Badge key={label} size="sm">
            {label}
          </Badge>
        ))}
      </div>
      {lines.map((line) =>
        line.isExample ? (
          <Text key={line.label} lang="en" size="body-sm" className="italic">
            “{line.value}”
          </Text>
        ) : (
          <Text key={line.label} size="body-sm" color="secondary">
            <span className="font-semibold text-text-primary">
              {line.label}:
            </span>{" "}
            {line.value}
          </Text>
        ),
      )}
    </div>
  );
}

export interface WordKnowledgeProps {
  word: LearnWord;
}

/**
 * Under the flashcard: what kind of word it is, then what the admin wrote for it,
 * one tab for each category that has something in it (word family, collocations,
 * phrasal verbs, patterns, formation, prepositions, synonyms, antonyms, related
 * words, conversations). A word with nothing written shows nothing here.
 */
export function WordKnowledge({ word }: WordKnowledgeProps) {
  const content = word.content ?? {};
  const available = CATEGORIES.filter(
    (category) => (content[category.key]?.length ?? 0) > 0,
  );
  const [tab, setTab] = useState<ContentCategory | undefined>(
    available[0]?.key,
  );
  const current = available.find((category) => category.key === tab)
    ? tab
    : available[0]?.key;

  return (
    <section
      aria-label={`Kiến thức về từ ${word.word}`}
      className="flex flex-col gap-3"
    >
      <WordInfo word={word} />
      {available.length > 0 && (
        <Tabs
          variant="pill"
          value={current}
          onValueChange={(next) => setTab(next as ContentCategory)}
        >
          <TabList
            aria-label={`Học sâu từ ${word.word}`}
            className="max-w-full"
          >
            {available.map((category) => (
              <TabTrigger key={category.key} value={category.key}>
                {category.label} ({content[category.key]?.length})
              </TabTrigger>
            ))}
          </TabList>
          {available.map((category) => (
            <TabPanel key={category.key} value={category.key}>
              {current === category.key && (
                <ul className="flex flex-col gap-3">
                  {content[category.key]?.map((item) => (
                    <li
                      key={item.id}
                      className="rounded-standard border-2 border-border-strong bg-surface-card p-3"
                    >
                      <ItemView category={category} item={item} />
                    </li>
                  ))}
                </ul>
              )}
            </TabPanel>
          ))}
        </Tabs>
      )}
    </section>
  );
}
