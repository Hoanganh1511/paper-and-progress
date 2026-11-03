import { Check, Layers, Link2, MessageSquareQuote, Shapes } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge, ProgressBar, Text } from "@/design-system";
import { splitMeaning } from "../../logs";
import type { DailyEnglishNotes, LoggedWord } from "../../types";

/** One of the three ways a word was practised, as a titled list under the word. */
function Group({
  title,
  icon: Icon,
  items,
  hasMeaning = false,
}: {
  title: string;
  icon: LucideIcon;
  items: readonly string[];
  /** "a long voyage: một chuyến đi dài" shows the phrase, then what it means. */
  hasMeaning?: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <section className="flex flex-col gap-2 border-t-2 border-border-subtle pt-3">
      <Text
        as="h5"
        size="body-sm"
        weight="semibold"
        color="secondary"
        className="flex items-center gap-1.5"
      >
        <Icon aria-hidden="true" size={14} />
        {title}
        <span className="font-normal">({items.length})</span>
      </Text>
      <ul className="flex flex-col gap-1.5">
        {items.map((item, index) => {
          const { term, meaning } = hasMeaning
            ? splitMeaning(item)
            : { term: item, meaning: undefined };
          return (
            <li
              key={`${index}-${item}`}
              className="flex flex-wrap items-baseline gap-x-2 border-l-4 border-border-subtle pl-3"
            >
              <span lang="en" className={hasMeaning ? "font-semibold" : ""}>
                {term}
              </span>
              {meaning && (
                <span className="text-body-sm text-text-secondary">
                  {meaning}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function WordCard({ word }: { word: LoggedWord }) {
  return (
    <li className="flex flex-col gap-3 rounded-standard border-2 border-border-strong bg-surface-card p-4 shadow-raised">
      <div className="flex flex-wrap items-center gap-2">
        <Text
          as="h4"
          lang="en"
          size="heading-sm"
          weight="bold"
          className="font-display"
        >
          {word.word}
        </Text>
        {word.isLearned && (
          <Badge variant="lime" icon={Check} size="sm">
            Đã học
          </Badge>
        )}
        {word.isKnown && (
          <Badge variant="blue" size="sm">
            Đã biết
          </Badge>
        )}
        {word.isReview && (
          <Badge variant="yellow" size="sm">
            Cần ôn lại
          </Badge>
        )}
      </div>
      {word.note && (
        <Text size="body-sm" color="secondary" className="italic">
          {word.note}
        </Text>
      )}
      <Group title="Ví dụ" icon={MessageSquareQuote} items={word.sentences} />
      <Group
        title="Cụm từ đi kèm"
        icon={Link2}
        items={word.collocations}
        hasMeaning
      />
      <Group
        title="Từ liên quan"
        icon={Shapes}
        items={word.related}
        hasMeaning
      />
      {word.others?.map((group) => (
        <Group
          key={group.label}
          title={group.label}
          icon={Layers}
          items={group.items}
          hasMeaning
        />
      ))}
    </li>
  );
}

/**
 * The words of a Daily English day: how many were learned, then one card per
 * word with its sentences, collocations and related words under it, so it is
 * clear which belong to which.
 */
export function DailyEnglishSection({ data }: { data: DailyEnglishNotes }) {
  if (data.words.length === 0 && data.total === undefined) return null;
  return (
    <section className="flex flex-col gap-3">
      <Text as="h3" size="body-sm" weight="semibold" color="secondary">
        Từ đã học trong ngày
      </Text>
      {data.learned !== undefined && data.total !== undefined && (
        <ProgressBar
          value={data.total ? (data.learned / data.total) * 100 : 0}
          label={`Đã học ${data.learned} trên ${data.total} từ`}
          showValue
        />
      )}
      {data.words.length > 0 && (
        <ul className="grid gap-4 xl:grid-cols-2">
          {data.words.map((word) => (
            <WordCard key={word.word} word={word} />
          ))}
        </ul>
      )}
    </section>
  );
}
