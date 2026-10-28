import type { ComponentProps } from "react";
import { CalendarDays, Check, Loader } from "lucide-react";
import { Badge, Card, Image, ProgressBar, Text, cn } from "@/design-system";
import { STATUS_LABELS, formatDevlogDate, getModuleLabel } from "../../status";
import type { DevlogEntry } from "../../types";
import { DevlogBlocks } from "../DevlogBlocks";

export interface DevlogEntryCardProps extends Omit<
  ComponentProps<"article">,
  "ref" | "title"
> {
  entry: DevlogEntry;
  /** Heading element of the title; pick the level that fits the page outline. */
  titleAs?: "h2" | "h3" | "h4";
  /** Shows only the first paragraph, without the picture or code. */
  isCompact?: boolean;
}

/**
 * One devlog entry: its date, title and status, the text, the tags, the
 * module's progress after the entry and, in full view, the picture or code
 * snippet. It has an `id` equal to the entry's slug so a link such as
 * `/devlog#2026-10-27-bookmarks` (also used by the RSS feed) lands on it.
 */
export function DevlogEntryCard({
  entry,
  titleAs: Title = "h3",
  isCompact = false,
  className,
  ...props
}: DevlogEntryCardProps) {
  const moduleLabel = getModuleLabel(entry.module);
  const blocks = isCompact
    ? entry.body.filter((block) => block.type === "paragraph").slice(0, 1)
    : entry.body;
  const isDone = entry.status === "done";

  return (
    <Card
      as="article"
      id={entry.slug}
      padding="compact"
      className={cn(
        "scroll-mt-[calc(var(--app-header-height,0px)+1rem)]",
        className,
      )}
      {...props}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Text
          as="span"
          size="body-sm"
          color="muted"
          className="inline-flex items-center gap-1"
        >
          <CalendarDays aria-hidden="true" size={14} />
          <time dateTime={entry.date}>{formatDevlogDate(entry.date)}</time>
        </Text>
        <Badge
          size="sm"
          variant={isDone ? "success" : "yellow"}
          icon={isDone ? Check : Loader}
        >
          {STATUS_LABELS[entry.status]}
        </Badge>
      </div>

      <Title className="m-0 font-display text-heading-sm font-semibold text-text-primary">
        {entry.title}
      </Title>

      <DevlogBlocks blocks={blocks} />

      {!isCompact && entry.image && (
        <Image
          src={entry.image}
          alt={entry.imageAlt ?? ""}
          aspectRatio="video"
          className="w-full"
        />
      )}

      {entry.tags.length > 0 && (
        <ul aria-label="Thẻ" className="m-0 flex list-none flex-wrap gap-1 p-0">
          {entry.tags.map((tag) => (
            <li key={tag}>
              <Badge size="sm">#{tag}</Badge>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <Text as="span" size="caption" color="secondary">
          {moduleLabel}
          {entry.phase && ` · Phase ${entry.phase}`}
        </Text>
        <ProgressBar
          value={entry.progress}
          label={`Tiến độ ${moduleLabel} sau cập nhật này`}
          showValue
          className="min-w-32 flex-1"
        />
      </div>
    </Card>
  );
}
