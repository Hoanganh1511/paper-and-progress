import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { Text, cn } from "@/design-system";
import type { LearningItem } from "../../types";

/** The colour of each card's offset shadow, in turn: pink, lime, violet, blue. */
export const TOPIC_ACCENTS = [
  "#ff4f9a",
  "#c7f500",
  "#b66bff",
  "#78b8ff",
] as const;

const initialsOf = (title: string) =>
  title.trim().slice(0, 1).toLocaleUpperCase("vi") || "?";

export interface TechTopicCardProps {
  item: LearningItem;
  /** The place in the grid; it picks the accent of the shadow and of the letter tile. */
  index: number;
}

/**
 * A topic as a white card with a black border and an offset shadow in its own
 * colour. A tile with the topic's first letter stands where a logo would, the
 * name is the link (stretched over the card) and the counts sit underneath. It
 * lifts on hover and keyboard focus, sinks when pressed, and keeps still with
 * reduced motion.
 */
export function TechTopicCard({ item, index }: TechTopicCardProps) {
  const accent = TOPIC_ACCENTS[index % TOPIC_ACCENTS.length];
  const title = (
    <span className="font-display text-[1.1875rem] leading-tight font-extrabold text-[#111]">
      {item.title}
    </span>
  );
  return (
    <article
      style={{ "--accent": accent } as CSSProperties}
      className={cn(
        "relative flex h-full min-h-[7rem] items-center gap-4 rounded-soft border-2 border-[#171717] bg-white p-4 text-[#171717]",
        "shadow-[5px_6px_0_0_var(--accent),7px_8px_0_0_#171717] sm:shadow-[8px_9px_0_0_var(--accent),10px_11px_0_0_#171717]",
        "transition-[transform,box-shadow] duration-200 ease-out",
        "hover:-translate-x-0.5 hover:-translate-y-[3px] hover:shadow-[10px_11px_0_0_var(--accent),12px_13px_0_0_#171717]",
        "focus-within:-translate-x-0.5 focus-within:-translate-y-[3px] focus-within:shadow-[10px_11px_0_0_var(--accent),12px_13px_0_0_#171717]",
        "active:translate-x-[3px] active:translate-y-[3px] active:shadow-[2px_2px_0_0_var(--accent)]",
        "motion-reduce:transition-none motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0 motion-reduce:focus-within:translate-x-0 motion-reduce:focus-within:translate-y-0",
      )}
    >
      <span
        aria-hidden="true"
        data-tile=""
        className="flex size-12 shrink-0 items-center justify-center rounded-standard sm:size-14 border-2 border-[#171717] bg-[color-mix(in_srgb,var(--accent)_30%,white)] font-display text-xl font-extrabold"
      >
        {initialsOf(item.title)}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <Text as="h4" className="min-w-0 leading-tight">
            {item.href ? (
              <Link
                href={item.href}
                className="rounded-sharp outline-none after:absolute after:inset-0 after:rounded-soft focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-solid focus-visible:after:outline-border-focus"
              >
                {title}
              </Link>
            ) : (
              title
            )}
          </Text>
          {item.href && (
            <ArrowRight
              aria-hidden="true"
              size={18}
              className="mt-0.5 shrink-0"
            />
          )}
        </div>
        {item.meta && (
          <span className="flex items-start gap-1.5 text-xs font-medium text-[#343434] sm:text-[0.8125rem]">
            <BookOpen
              aria-hidden="true"
              size={15}
              className="mt-0.5 shrink-0"
            />
            <span>{item.meta.replaceAll("·", "•")}</span>
          </span>
        )}
      </div>
    </article>
  );
}
