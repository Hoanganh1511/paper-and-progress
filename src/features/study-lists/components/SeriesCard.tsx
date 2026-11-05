"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CheckCheck,
  Clock,
  Code2,
  Ghost,
  Layers,
  Lightbulb,
} from "lucide-react";
import { Badge, cn } from "@/design-system";
import type { SeriesShowcase, SeriesTone } from "../seriesShowcase";

interface ToneStyle {
  /** The hard offset shadow, thick at the bottom, in the colour of the series. */
  shadow: string;
  /** The dark band with the name of the series. */
  header: string;
  /** The tint behind the list of lessons. */
  body: string;
  /** The colour of the picture on the band. */
  picture: string;
  icon: LucideIcon;
}

const TONE_STYLES: Record<SeriesTone, ToneStyle> = {
  pink: {
    shadow:
      "shadow-[4px_10px_0_0_var(--color-accent-pink)] hover:shadow-[6px_14px_0_0_var(--color-accent-pink)]",
    header: "bg-[linear-gradient(135deg,#3b2a23,#231612)]",
    body: "bg-surface-card",
    picture: "text-accent-yellow border-accent-yellow",
    icon: Code2,
  },
  lime: {
    shadow:
      "shadow-[4px_10px_0_0_var(--color-accent-lime)] hover:shadow-[6px_14px_0_0_var(--color-accent-lime)]",
    header: "bg-[linear-gradient(135deg,#2e3416,#1a2010)]",
    body: "bg-[color-mix(in_srgb,var(--color-accent-lime)_28%,white)]",
    picture: "text-accent-lime border-accent-lime",
    icon: Layers,
  },
  blue: {
    shadow:
      "shadow-[4px_10px_0_0_var(--color-accent-blue)] hover:shadow-[6px_14px_0_0_var(--color-accent-blue)]",
    header: "bg-[linear-gradient(135deg,#2c2548,#191430)]",
    body: "bg-[color-mix(in_srgb,var(--color-accent-blue)_30%,white)]",
    picture: "text-accent-blue border-accent-blue",
    icon: Ghost,
  },
  yellow: {
    shadow:
      "shadow-[4px_10px_0_0_var(--color-accent-yellow)] hover:shadow-[6px_14px_0_0_var(--color-accent-yellow)]",
    header: "bg-[linear-gradient(135deg,#3d3012,#251c09)]",
    body: "bg-[color-mix(in_srgb,var(--color-accent-yellow)_30%,white)]",
    picture: "text-accent-yellow border-accent-yellow",
    icon: Lightbulb,
  },
};

const FOCUS =
  "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-border-focus";

/** "2026-10-27T08:00:00Z" -> "27/10/2026", cut from the text so server and browser agree. */
const formatDate = (iso: string) =>
  `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;

export interface SeriesCardProps {
  series: SeriesShowcase;
  tone: SeriesTone;
  /**
   * `full` shows everything; `compact` is for a card standing behind another
   * one: the name, the picture, the count and the lessons' titles, no
   * description, dates or reading times.
   */
  variant?: "full" | "compact";
  /** The certificates the list is studied for; a showcase may leave them out. */
  showCertificates?: boolean;
  /** The size of the card and where it stands; the card has none of its own. */
  className?: string;
}

/**
 * One series (study list): a dark band with the name, the description and a
 * picture, then its first lessons as a numbered list with the date and the
 * reading time, and the certificates it is studied for. Every title is a link,
 * so the card works from the keyboard. The box keeps its size: titles are cut
 * at two lines.
 */
export function SeriesCard({
  series,
  tone,
  variant = "full",
  showCertificates = true,
  className,
}: SeriesCardProps) {
  const isCompact = variant === "compact";
  const style = TONE_STYLES[tone];
  const Picture = style.icon;

  return (
    <article
      aria-label={`Series ${series.title}`}
      className={cn(
        "flex cursor-default flex-col overflow-hidden rounded-soft border-2 border-border-strong text-ink transition-shadow duration-[var(--duration-fast)] motion-reduce:transition-none",
        style.body,
        style.shadow,
        className,
      )}
    >
      <div
        className={cn(
          "flex min-h-[9.5rem] shrink-0 flex-col gap-3 p-4 text-white xl:p-5",
          style.header,
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex h-7 items-center gap-1.5 rounded-pill bg-white px-3 text-body-sm font-semibold text-ink">
            <Layers aria-hidden="true" size={14} />
            Series
          </span>
          <span className="inline-flex h-7 items-center gap-1.5 rounded-pill bg-white px-3 text-body-sm font-semibold text-ink">
            <Layers aria-hidden="true" size={14} />
            {series.stepCount} bài
          </span>
        </div>
        <div className="flex flex-1 items-center gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <h3 className="line-clamp-2 font-display text-heading-md font-bold [overflow-wrap:anywhere]">
              <Link
                href={`/study-lists/${series.id}`}
                className={cn(
                  "group/title cursor-pointer rounded-sharp underline-offset-4 hover:underline hover:decoration-2 focus-visible:underline focus-visible:decoration-2",
                  FOCUS,
                )}
              >
                {series.title}
                <ArrowUpRight
                  aria-hidden="true"
                  size={20}
                  className="ml-1 inline align-[-0.15em] opacity-0 transition-opacity duration-[var(--duration-fast)] group-hover/title:opacity-100 group-focus-visible/title:opacity-100 motion-reduce:transition-none"
                />
              </Link>
            </h3>
            {!isCompact && series.description && (
              <p className="line-clamp-2 text-body-sm text-white/85 [overflow-wrap:anywhere]">
                {series.description}
              </p>
            )}
          </div>
          <span
            aria-hidden="true"
            className={cn(
              "flex size-16 shrink-0 items-center justify-center rounded-soft border-2 bg-white/5 sm:size-20",
              style.picture,
            )}
          >
            <Picture size={36} strokeWidth={2.25} />
          </span>
        </div>
      </div>
      <ol
        aria-label={`Các bài của series ${series.title}`}
        className="flex flex-1 flex-col divide-y-2 divide-border-strong/15"
      >
        {series.steps.length === 0 && (
          <li className="p-3 text-body-sm text-ink/80">
            {series.sectionCount} chương · chưa có bài nào.
          </li>
        )}
        {series.steps.map((step, index) => (
          <li
            key={step.id}
            className={cn(
              "group/row relative flex cursor-pointer items-center gap-3 p-3 transition-colors duration-[var(--duration-fast)] motion-reduce:transition-none",
              "hover:bg-ink/5 focus-within:bg-ink/5",
              "before:absolute before:inset-y-0 before:left-0 before:w-1.5 before:bg-ink before:opacity-0 before:transition-opacity hover:before:opacity-100 focus-within:before:opacity-100 motion-reduce:before:transition-none",
            )}
          >
            <span
              aria-hidden="true"
              className="flex size-10 shrink-0 items-center justify-center rounded-standard border-2 border-border-strong bg-surface-card font-display text-body-md font-bold transition-colors duration-[var(--duration-fast)] group-hover/row:bg-ink group-hover/row:text-white group-focus-within/row:bg-ink group-focus-within/row:text-white motion-reduce:transition-none"
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <Link
                href={step.href}
                className={cn(
                  isCompact ? "line-clamp-1" : "line-clamp-2",
                  "w-fit rounded-sharp text-body-md font-bold underline-offset-4 [overflow-wrap:anywhere] after:absolute after:inset-0 group-hover/row:underline focus-visible:underline",
                  FOCUS,
                )}
              >
                {step.title}
              </Link>
              <span
                className={cn(
                  "flex-wrap items-center gap-x-4 gap-y-0.5 text-body-sm text-ink/80",
                  isCompact ? "hidden" : "flex",
                )}
              >
                {step.publishedAt && (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays aria-hidden="true" size={14} />
                    <time dateTime={step.publishedAt}>
                      {formatDate(step.publishedAt)}
                    </time>
                  </span>
                )}
                {step.minutes !== null && (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock aria-hidden="true" size={14} />
                    {step.minutes} phút đọc
                  </span>
                )}
                {step.isDone && (
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCheck aria-hidden="true" size={14} />
                    Đã học
                  </span>
                )}
              </span>
            </div>
            <ArrowRight
              aria-hidden="true"
              size={20}
              className={cn(
                isCompact && "hidden",
                "shrink-0 transition-transform duration-[var(--duration-fast)] group-hover/row:translate-x-1 group-focus-within/row:translate-x-1 motion-reduce:transition-none",
              )}
            />
          </li>
        ))}
      </ol>
      {showCertificates && series.certificates.length > 0 && (
        <ul
          aria-label="Chứng chỉ liên kết"
          className="flex flex-wrap gap-2 border-t-2 border-border-strong/15 p-3"
        >
          {series.certificates.map((certificate) => (
            <li key={certificate.id}>
              <Link
                href={`/certificates/${certificate.id}`}
                className={cn("rounded-pill", FOCUS)}
              >
                <Badge variant="lime" size="sm">
                  {certificate.name}
                </Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
