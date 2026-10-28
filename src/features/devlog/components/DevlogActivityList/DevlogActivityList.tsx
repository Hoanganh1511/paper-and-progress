import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";
import { Check, Loader } from "lucide-react";
import { Badge, Text, cn, focusRingClasses } from "@/design-system";
import {
  STATUS_LABELS,
  formatDevlogDate,
  getEntrySummary,
  getModuleLabel,
} from "../../status";
import type { DevlogEntry } from "../../types";

interface DateGroup {
  date: string;
  entries: DevlogEntry[];
}

/** Entries are already sorted, so same-day entries sit next to each other. */
function groupByDate(entries: DevlogEntry[]): DateGroup[] {
  const groups: DateGroup[] = [];
  for (const entry of entries) {
    const last = groups.at(-1);
    if (last?.date === entry.date) last.entries.push(entry);
    else groups.push({ date: entry.date, entries: [entry] });
  }
  return groups;
}

const ITEM_CLASSES = cn(
  "flex w-full min-h-11 flex-col items-start gap-2 rounded-standard border-2 border-border-strong bg-surface-card p-3 text-left shadow-raised",
  "transition-transform duration-[var(--duration-fast)] motion-reduce:transition-none",
  "active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
  "aria-[current=true]:translate-x-0.5 aria-[current=true]:translate-y-0.5 aria-[current=true]:bg-accent-blue/20 aria-[current=true]:shadow-none",
  focusRingClasses,
);

/** A button, or a link when only `hrefFor` is given, in the card shape. */
function Item({
  entrySlug,
  isSelected,
  onSelectEntry,
  hrefFor,
  children,
}: {
  entrySlug: string;
  isSelected: boolean;
  onSelectEntry?: (slug: string) => void;
  hrefFor?: (slug: string) => string;
  children: ReactNode;
}) {
  const current = isSelected ? "true" : undefined;
  if (!onSelectEntry && hrefFor) {
    return (
      <Link
        href={hrefFor(entrySlug)}
        aria-current={current}
        className={ITEM_CLASSES}
      >
        {children}
      </Link>
    );
  }
  return (
    <button
      type="button"
      aria-current={current}
      onClick={() => onSelectEntry?.(entrySlug)}
      className={ITEM_CLASSES}
    >
      {children}
    </button>
  );
}

export interface DevlogActivityListProps extends Omit<
  ComponentProps<"ol">,
  "children" | "ref"
> {
  /** Newest first. */
  entries: DevlogEntry[];
  selectedSlug?: string;
  /** Makes each entry a button that calls this with its slug. */
  onSelectEntry?: (slug: string) => void;
  /** Makes each entry a link to this address instead (when no `onSelectEntry`). */
  hrefFor?: (slug: string) => string;
  /** Shows the date heading above each day's entries. */
  showDates?: boolean;
}

/**
 * The timeline: entries grouped under their day, along a rule with a node per
 * entry. Each entry is a button, so a click or Enter/Space selects it; the
 * selected one stays in its pressed shape and is marked with `aria-current`.
 */
export function DevlogActivityList({
  entries,
  selectedSlug,
  onSelectEntry,
  hrefFor,
  showDates = true,
  className,
  ...props
}: DevlogActivityListProps) {
  return (
    <ol
      className={cn("m-0 flex list-none flex-col gap-6 p-0", className)}
      {...props}
    >
      {groupByDate(entries).map((group) => (
        <li key={group.date} className="flex flex-col gap-3">
          {showDates && (
            <Text as="h3" size="body-md" weight="semibold">
              <time dateTime={group.date}>{formatDevlogDate(group.date)}</time>
            </Text>
          )}
          <ol className="m-0 flex list-none flex-col gap-3 border-l-2 border-border-strong p-0 pl-6">
            {group.entries.map((entry) => {
              const isSelected = entry.slug === selectedSlug;
              const isDone = entry.status === "done";
              const summary = getEntrySummary(entry);
              return (
                <li key={entry.slug} className="relative">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute top-5 -left-[calc(1.5rem+7px)] size-3 rounded-pill border-2 border-border-strong",
                      isSelected ? "bg-accent-blue" : "bg-surface-card",
                    )}
                  />
                  <Item
                    entrySlug={entry.slug}
                    isSelected={isSelected}
                    onSelectEntry={onSelectEntry}
                    hrefFor={hrefFor}
                  >
                    <span className="flex flex-wrap items-center gap-2">
                      <Badge
                        size="sm"
                        variant={isDone ? "success" : "yellow"}
                        icon={isDone ? Check : Loader}
                      >
                        {STATUS_LABELS[entry.status]}
                      </Badge>
                      <Text as="span" size="caption" color="muted">
                        {getModuleLabel(entry.module)}
                      </Text>
                    </span>
                    <Text
                      as="span"
                      size="body-md"
                      weight="semibold"
                      className="block"
                    >
                      {entry.title}
                    </Text>
                    {summary && (
                      <Text
                        as="span"
                        size="body-sm"
                        color="secondary"
                        className="line-clamp-2 block"
                      >
                        {summary}
                      </Text>
                    )}
                    {entry.tags.length > 0 && (
                      <Text as="span" size="caption" color="muted">
                        {entry.tags.map((tag) => `#${tag}`).join(" ")}
                      </Text>
                    )}
                    <span className="flex w-full items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="block h-1.5 flex-1 overflow-hidden rounded-pill border border-border-strong bg-surface-sunken"
                      >
                        <span
                          className="block h-full bg-accent-blue"
                          style={{ width: `${entry.progress}%` }}
                        />
                      </span>
                      <Text as="span" size="caption" color="secondary">
                        {entry.progress}% hoàn thành
                      </Text>
                    </span>
                  </Item>
                </li>
              );
            })}
          </ol>
        </li>
      ))}
    </ol>
  );
}
