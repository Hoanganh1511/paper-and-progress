import type { CSSProperties } from "react";
import Link from "next/link";
import { CalendarDays, Clock, Lock, User } from "lucide-react";
import { Badge, cn } from "@/design-system";
import type { ArticleCardData } from "@/features/articles";
import { ArticleIllustration, illustrationOf } from "./ArticleIllustration";

/**
 * The accent of each card, in the order of the cards: pink, lime, violet. The
 * accent is on the card in at least four places (the offset shadow, the line
 * under the title, the drawing and the tint of the bar below), so it reads as
 * the card's own colour and not only as a shadow. These are the colours of the
 * design brief, not tokens.
 */
export const ACCENTS = ["#ff4f9a", "#c7f500", "#b66bff"] as const;

/** "2026-10-27T08:00:00Z" -> "27/10/2026", cut from the text so server and browser agree. */
const formatDate = (iso: string) =>
  `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;

// The offset shadow is the accent colour, with a 3px black layer behind it; it
// shrinks on smaller screens. On hover it lifts and deepens; pressed, it sinks
// into the page and the black layer is gone. A hover-less (touch) screen only
// ever shows the pressed state. No blur anywhere.
const CARD_CLASSES = cn(
  "group relative flex min-h-[19.5rem] w-full flex-col gap-4 rounded-[1.5rem] border-2 border-[#171717] bg-white p-[18px] text-[#171717]",
  "shadow-[5px_5px_0_0_var(--accent),8px_8px_0_0_#171717]",
  "sm:p-[22px] sm:shadow-[6px_7px_0_0_var(--accent),9px_10px_0_0_#171717]",
  "xl:p-7 xl:shadow-[8px_9px_0_0_var(--accent),11px_12px_0_0_#171717]",
  "transition-[transform,box-shadow] duration-200 ease-out",
  "hover:-translate-x-0.5 hover:-translate-y-[3px] hover:shadow-[8px_9px_0_0_var(--accent),11px_12px_0_0_#171717] xl:hover:shadow-[10px_11px_0_0_var(--accent),13px_14px_0_0_#171717]",
  "focus-within:-translate-x-0.5 focus-within:-translate-y-[3px]",
  "active:translate-x-[5px] active:translate-y-[5px] active:shadow-[2px_2px_0_0_var(--accent)] xl:active:shadow-[2px_2px_0_0_var(--accent)]",
  "motion-reduce:transition-none motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0 motion-reduce:focus-within:translate-x-0 motion-reduce:focus-within:translate-y-0",
);

export interface LibraryArticleCardProps {
  article: ArticleCardData;
  /** The place among the cards; it picks the accent colour (and the drawing, if no tag does). */
  index: number;
  /** Show the "Xem trước" badge (a limited article, for a reader who is not a member). */
  showBadge: boolean;
}

/**
 * One article as a card of the library. White, with a 2px black border and an
 * offset shadow in the card's accent. From the top: the badge (if any), the
 * title with a small drawing at its right, a short accent line, the summary,
 * and a bar with the author, the date and the reading time. Titles and summaries
 * are cut at three lines and keep their room, so the bars of all the cards sit
 * on one line.
 */
export function LibraryArticleCard({
  article,
  index,
  showBadge,
}: LibraryArticleCardProps) {
  const accent = ACCENTS[index % ACCENTS.length];
  return (
    <article
      style={{ "--accent": accent } as CSSProperties}
      className={CARD_CLASSES}
    >
      {showBadge && (
        <Badge
          size="sm"
          variant="yellow"
          icon={Lock}
          className="w-fit border-2 border-[#171717] bg-[#ffd42a] px-3 text-xs font-bold text-[#171717]"
        >
          {article.visibility === "MEMBERS_ONLY" ? "Hội viên" : "Xem trước"}
        </Badge>
      )}
      <div className="flex items-start gap-3">
        <h3 className="line-clamp-3 min-h-[4.25rem] min-w-0 flex-1 font-display text-[1.125rem] leading-[1.25] font-extrabold text-[#111] xl:min-h-[4.7rem] xl:text-[1.25rem]">
          <Link
            href={`/articles/${article.slug}`}
            className="outline-none after:absolute after:inset-0 after:rounded-[1.5rem] focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-solid focus-visible:after:outline-border-focus"
          >
            {article.title}
          </Link>
        </h3>
        <ArticleIllustration
          kind={illustrationOf(article, index)}
          accent={accent}
          className="size-[3.25rem] shrink-0 sm:size-[3.75rem] xl:size-[4.5rem]"
        />
      </div>
      <span
        aria-hidden="true"
        data-accent-line=""
        className="-mt-1 block h-[7px] w-[8.75rem] -rotate-1 rounded-full bg-[var(--accent)]"
      />
      <p className="line-clamp-3 min-h-[4.5rem] text-sm leading-[1.6] font-normal text-[#343434] sm:text-[0.9375rem]">
        {article.excerpt}
      </p>
      <div
        data-meta-bar=""
        className="mt-auto flex min-h-12 flex-wrap items-center gap-x-2.5 gap-y-1 rounded-full sm:flex-nowrap bg-[color-mix(in_srgb,var(--accent)_12%,white)] px-4 py-2 text-[0.8125rem] font-semibold text-[#171717]"
      >
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <User aria-hidden="true" size={16} className="shrink-0" />
          <span className="sm:truncate">
            {article.author.displayName ?? "Tác giả ẩn danh"}
          </span>
        </span>
        {article.publishedAt && (
          <>
            <span aria-hidden="true" className="shrink-0 max-sm:hidden">
              |
            </span>
            <span className="inline-flex shrink-0 items-center gap-1.5">
              <CalendarDays aria-hidden="true" size={16} className="shrink-0" />
              <time dateTime={article.publishedAt}>
                {formatDate(article.publishedAt)}
              </time>
            </span>
          </>
        )}
        <span aria-hidden="true" className="shrink-0 max-sm:hidden">
          |
        </span>
        <span className="inline-flex shrink-0 items-center gap-1.5">
          <Clock aria-hidden="true" size={16} className="shrink-0" />
          {article.readingMinutes} phút đọc
        </span>
      </div>
    </article>
  );
}
