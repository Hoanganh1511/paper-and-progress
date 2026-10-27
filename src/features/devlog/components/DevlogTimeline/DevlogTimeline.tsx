import type { ComponentProps } from "react";
import { cn } from "@/design-system";
import type { DevlogEntry } from "../../types";
import { DevlogEntryCard } from "../DevlogEntryCard";

export interface DevlogTimelineProps extends Omit<
  ComponentProps<"ol">,
  "children" | "ref"
> {
  entries: DevlogEntry[];
  /** Heading element of each entry's title. */
  titleAs?: "h2" | "h3" | "h4";
  isCompact?: boolean;
}

/**
 * Entries as a vertical timeline, newest on top: a rule down the left side
 * with a dot at each entry. It is an ordered list, so a screen reader
 * announces the position of each entry.
 */
export function DevlogTimeline({
  entries,
  titleAs,
  isCompact,
  className,
  ...props
}: DevlogTimelineProps) {
  return (
    <ol
      className={cn(
        "m-0 flex list-none flex-col gap-6 border-l-2 border-border-strong p-0 pl-6",
        className,
      )}
      {...props}
    >
      {entries.map((entry) => (
        <li key={entry.slug} className="relative">
          <span
            aria-hidden="true"
            className="absolute top-5 -left-[calc(1.5rem+7px)] size-3 rounded-pill border-2 border-border-strong bg-accent-lime"
          />
          <DevlogEntryCard
            entry={entry}
            titleAs={titleAs}
            isCompact={isCompact}
          />
        </li>
      ))}
    </ol>
  );
}
