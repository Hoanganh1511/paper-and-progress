"use client";

import Link from "next/link";
import { ArrowRight, CheckCheck, Clock, Layers } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/design-system";
import type { SeriesShowcase } from "./types";
import { type Pose, type SeriesTone } from "./carouselLayout";

/** The hard offset shadow takes the colour of the series. */
const SHADOW_BY_TONE: Record<SeriesTone, string> = {
  pink: "shadow-[6px_6px_0_0_var(--color-accent-pink)]",
  lime: "shadow-[6px_6px_0_0_var(--color-accent-lime)]",
  blue: "shadow-[6px_6px_0_0_var(--color-accent-blue)]",
  yellow: "shadow-[6px_6px_0_0_var(--color-accent-yellow)]",
};

const NUMBER_BY_TONE: Record<SeriesTone, string> = {
  pink: "bg-accent-pink",
  lime: "bg-accent-lime",
  blue: "bg-accent-blue",
  yellow: "bg-accent-yellow",
};

const FOCUS =
  "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-border-focus";

export interface SeriesCardProps {
  series: SeriesShowcase;
  tone: SeriesTone;
  pose: Pose;
  className?: string;
}

/**
 * One series (study list) of the showcase: its name and description on a dark band, then its
 * first lessons as a numbered list. Every title is a link, so the card
 * works from the keyboard. The box keeps its size: titles are cut at two lines.
 */
export function SeriesCard({ series, tone, pose, className }: SeriesCardProps) {
  const isReduced = useReducedMotion();

  return (
    <motion.article
      style={{ zIndex: pose.zIndex }}
      initial={false}
      animate={{ scale: pose.scale, y: pose.y, rotate: pose.rotate }}
      whileHover={
        isReduced
          ? undefined
          : {
              y: pose.y - 8,
              rotate: pose.rotate * 0.5,
              transition: { duration: 0.2 },
            }
      }
      transition={{ duration: isReduced ? 0 : 0.5, ease: "easeInOut" }}
      aria-label={`Series ${series.title}`}
      className={cn(
        "flex w-72 shrink-0 flex-col overflow-hidden rounded-standard border-2 border-border-strong bg-surface-card text-ink sm:w-96 xl:w-[26rem]",
        SHADOW_BY_TONE[tone],
        className,
      )}
    >
      <div className="flex min-h-[9.5rem] flex-col gap-2 bg-[#2f2019] p-4 text-white">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex h-6 items-center gap-1.5 rounded-pill bg-white px-2.5 text-body-sm font-semibold text-ink">
            <Layers aria-hidden="true" size={14} />
            Series
          </span>
          <span className="inline-flex h-6 items-center rounded-pill bg-white/15 px-2.5 text-body-sm font-medium">
            {series.stepCount} bài
          </span>
        </div>
        <h3 className="line-clamp-2 font-display text-heading-sm font-bold">
          <Link
            href={`/study-lists/${series.id}`}
            className={cn(
              "rounded-sharp underline-offset-4 hover:text-accent-lime hover:underline focus-visible:underline",
              FOCUS,
            )}
          >
            {series.title}
          </Link>
        </h3>
        {series.description && (
          <p className="line-clamp-2 text-body-sm text-white/80">
            {series.description}
          </p>
        )}
      </div>
      <ol
        aria-label={`Các bài của series ${series.title}`}
        className="flex flex-1 flex-col divide-y-2 divide-border-subtle"
      >
        {series.steps.map((step, index) => (
          <li key={step.id} className="relative flex gap-3 p-3">
            <span
              aria-hidden="true"
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-standard border-2 border-border-strong font-display text-body-sm font-bold",
                NUMBER_BY_TONE[tone],
              )}
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <Link
                href={step.href}
                className={cn(
                  "line-clamp-2 w-fit rounded-sharp text-body-md font-semibold underline-offset-4 after:absolute after:inset-0 hover:underline focus-visible:underline",
                  FOCUS,
                )}
              >
                {step.title}
              </Link>
              <span className="flex flex-wrap items-center gap-x-3 text-body-sm text-text-secondary">
                {step.minutes !== null && (
                  <span className="inline-flex items-center gap-1">
                    <Clock aria-hidden="true" size={14} />
                    {step.minutes} phút đọc
                  </span>
                )}
                {step.isDone && (
                  <span className="inline-flex items-center gap-1">
                    <CheckCheck aria-hidden="true" size={14} />
                    Đã học
                  </span>
                )}
              </span>
            </div>
            <ArrowRight
              aria-hidden="true"
              size={18}
              className="mt-2 shrink-0"
            />
          </li>
        ))}
      </ol>
    </motion.article>
  );
}
