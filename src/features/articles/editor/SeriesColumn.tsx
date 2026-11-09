"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  Database,
  Layers,
  LayoutGrid,
  ListChecks,
  Network,
  ShieldCheck,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  cn,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/design-system";
import type { StudyListDetail } from "@/features/study-lists";

const FOCUS =
  "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-border-focus";

const STATUS_LABEL = {
  DRAFT: "Nháp",
  SCHEDULED: "Hẹn giờ",
  PUBLISHED: "Đã đăng",
  ARCHIVED: "Lưu trữ",
} as const;

/** A part has no icon of its own: they go round by its place in the list. */
const SECTION_ICONS: LucideIcon[] = [
  Layers,
  Zap,
  LayoutGrid,
  Network,
  Database,
  ShieldCheck,
];

type Section = StudyListDetail["sections"][number];

/** The stack of code windows on the lime blob, at the top right of the card. */
function SeriesArt() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 120 100"
      className="size-24 shrink-0 text-ink"
    >
      <path
        d="M10 30c0-14 14-24 30-24 12 0 18 6 30 6 18 0 34 12 34 34 0 22-16 38-38 38-14 0-18-6-30-6C22 78 10 56 10 30Z"
        fill="var(--color-accent-lime)"
      />
      <g fill="var(--color-surface-card)" stroke="currentColor" strokeWidth="3">
        <rect
          x="46"
          y="14"
          width="44"
          height="34"
          rx="4"
          transform="rotate(12 68 31)"
          fill="var(--color-accent-blue)"
        />
        <rect
          x="38"
          y="24"
          width="44"
          height="34"
          rx="4"
          transform="rotate(6 60 41)"
        />
        <rect x="26" y="38" width="48" height="38" rx="4" />
      </g>
      <path d="M26 48h48" stroke="currentColor" strokeWidth="3" />
      <path
        d="m44 58-6 6 6 6m12-12 6 6-6 6m-4-14-4 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M92 4 96 16M104 8l-4 12M112 20l-10 6"
        stroke="var(--color-accent-yellow)"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SectionAccordion({
  section,
  icon: Icon,
  articleId,
  isOpenAtFirst,
}: {
  section: Section;
  icon: LucideIcon;
  articleId: string;
  isOpenAtFirst: boolean;
}) {
  const [isOpen, setIsOpen] = useState(isOpenAtFirst);
  return (
    <details
      open={isOpen}
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
      className="group/section"
    >
      <summary
        className={cn(
          "flex min-h-11 cursor-pointer list-none items-center gap-3 rounded-standard border-2 border-border-strong px-3 py-2 font-display text-body-md font-bold text-ink shadow-floating transition-transform active:translate-x-0.5 active:translate-y-0.5 active:shadow-none motion-reduce:transition-none [&::-webkit-details-marker]:hidden",
          FOCUS,
          isOpenAtFirst ? "bg-accent-lime" : "bg-surface-card",
        )}
      >
        <Icon aria-hidden="true" size={20} className="shrink-0" />
        <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">
          {section.title}
        </span>
        <ChevronDown
          aria-hidden="true"
          size={20}
          className="shrink-0 transition-transform group-open/section:rotate-180 motion-reduce:transition-none"
        />
      </summary>
      <ol className="relative mt-3 flex flex-col gap-1 px-3 py-1">
        {/* The line the lessons hang on. */}
        <span
          aria-hidden="true"
          hidden={section.steps.length === 0}
          className="absolute top-5 bottom-5 left-[1.3125rem] z-10 w-0.5 bg-border-strong"
        />
        {section.steps.length === 0 && (
          <li className="py-1.5 pl-7 text-body-md text-text-muted">
            Chưa có bài nào trong phần này.
          </li>
        )}
        {section.steps.map((step) => {
          const article = step.article;
          const isCurrent = article?.id === articleId;
          const row = cn(
            "relative flex min-h-10 items-center gap-3 rounded-standard py-1.5 pr-2 pl-7 text-body-md [overflow-wrap:anywhere]",
            isCurrent
              ? "bg-accent-lime/35 font-bold text-ink"
              : "text-text-primary",
          );
          const node = (
            <span
              aria-hidden="true"
              className={cn(
                "absolute top-1/2 left-1 z-20 size-3 -translate-y-1/2 rounded-full border-2 border-border-strong",
                isCurrent ? "bg-ink" : "bg-surface-card",
              )}
            />
          );
          return (
            <li key={step.id}>
              {article ? (
                <Link
                  href={`/write/${article.id}`}
                  aria-current={isCurrent ? "page" : undefined}
                  className={cn(
                    row,
                    FOCUS,
                    !isCurrent && "hover:underline hover:underline-offset-4",
                  )}
                >
                  {node}
                  <span className="min-w-0 flex-1">{article.title}</span>
                  {article.status !== "PUBLISHED" && (
                    <span className="shrink-0 text-body-sm font-normal text-text-muted">
                      {STATUS_LABEL[article.status]}
                    </span>
                  )}
                </Link>
              ) : (
                <span className={cn(row, "text-text-muted")}>
                  {node}
                  {step.title}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </details>
  );
}

export interface SeriesColumnProps {
  list: StudyListDetail;
  /** Every study list the reader can pick from, the shown one included. */
  lists: StudyListDetail[];
  onSelectList: (id: string) => void;
  /** The article being edited; its lesson is marked, and its part is open. */
  articleId: string;
}

/** The series of the article as a card: its progress, the way back, and its parts with their lessons. */
export function SeriesColumn({
  list,
  lists,
  onSelectList,
  articleId,
}: SeriesColumnProps) {
  return (
    <aside
      aria-label={`Series ${list.title}`}
      // One hard ink shadow, no second slab beside the scrollbar. The card
      // itself does not scroll: the padded box inside does.
      className="flex min-w-0 flex-col rounded-[1.25rem] border-2 border-border-strong bg-surface-card py-3 pl-3 shadow-modal lg:sticky lg:top-[calc(var(--app-header-height,4rem)+1rem)] lg:max-h-[calc(100dvh-var(--app-header-height,4rem)-2.5rem)]"
    >
      {/* Outside the scrolling box, so the list it opens is not cut by it. */}
      {lists.length > 1 && (
        <div className="px-2 pr-3 pb-1">
          <Select value={list.id} onValueChange={onSelectList}>
            <SelectTrigger size="compact" aria-label="Chọn danh sách học" />
            <SelectContent>
              {lists.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-contain p-2 pr-3 [scrollbar-color:var(--color-border-strong)_transparent] [scrollbar-gutter:stable] [scrollbar-width:thin]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-2">
            <p className="flex items-center gap-2 text-body-md text-text-primary">
              <Layers aria-hidden="true" size={18} />
              Series học
            </p>
            <h2 className="font-display text-heading-lg leading-tight font-bold text-text-primary [overflow-wrap:anywhere]">
              {list.title}
            </h2>
          </div>
          <SeriesArt />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-2 text-body-md text-text-primary">
            <span>
              {list.doneStepCount}/{list.stepCount} bài viết
            </span>
            <span className="font-display font-bold">{list.progress}%</span>
          </div>
          <div
            role="progressbar"
            aria-label="Tiến độ series"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={list.progress}
            className="h-2.5 overflow-hidden rounded-pill border-2 border-border-strong bg-surface-sunken"
          >
            <div
              className="h-full bg-accent-lime"
              style={{ width: `${list.progress}%` }}
            />
          </div>
        </div>
        <Link
          href={`/study-lists/${list.id}`}
          className={cn(
            "flex min-h-11 items-center gap-3 rounded-standard border-2 border-border-strong bg-surface-card px-3 py-2 font-display text-body-md font-bold text-ink shadow-floating transition-transform active:translate-x-0.5 active:translate-y-0.5 active:shadow-none motion-reduce:transition-none",
            FOCUS,
          )}
        >
          <ListChecks aria-hidden="true" size={20} />
          Về danh sách học
        </Link>
        <nav aria-label="Các bài trong series" className="flex flex-col gap-4">
          {list.sections.map((section, index) => {
            const isCurrent = section.steps.some(
              (step) => step.article?.id === articleId,
            );
            return (
              <SectionAccordion
                // A new key opens the part the article moved into.
                key={`${section.id}-${isCurrent}`}
                section={section}
                icon={SECTION_ICONS[index % SECTION_ICONS.length]}
                articleId={articleId}
                isOpenAtFirst={isCurrent}
              />
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
