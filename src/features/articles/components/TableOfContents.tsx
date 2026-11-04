"use client";

import { useEffect, useId, useState } from "react";
import { ArrowRight, Box, Layers, Tag } from "lucide-react";
import { Text, cn } from "@/design-system";
import { Ticks } from "@/features/decor";
import type { TocItem } from "../toc";

export interface TableOfContentsProps {
  items: TocItem[];
}

export interface TocSection {
  heading: TocItem;
  /** The h3 headings under it, in order. */
  children: TocItem[];
}

/**
 * Groups the flat list into sections: each h2 with the h3s that follow it. An
 * h3 before any h2 stands as a section of its own, so nothing is lost.
 */
export function groupToc(items: TocItem[]): TocSection[] {
  const sections: TocSection[] = [];
  for (const item of items) {
    if (item.level === 2 || sections.length === 0) {
      sections.push({ heading: item, children: [] });
    } else {
      sections[sections.length - 1].children.push(item);
    }
  }
  return sections;
}

/** Distance from the top of the viewport (below the sticky header) where a heading counts as reached. */
const READING_LINE = 120;

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-border-focus";

/**
 * The body of the table of contents: the sections as a vertical line of dots
 * (the one being read filled and lime), then the h3 headings of the section
 * being read as numbered rows, then a lime button to the next section.
 */
function TocBody({
  sections,
  activeId,
}: {
  sections: TocSection[];
  activeId: string | undefined;
}) {
  const found = sections.findIndex(
    (section) =>
      section.heading.id === activeId ||
      section.children.some((child) => child.id === activeId),
  );
  // Until a heading has been reached, the first section is the one shown below.
  const titleId = useId();
  const current = sections[found === -1 ? 0 : found];
  const next = found === -1 ? undefined : sections[found + 1];

  return (
    <div className="flex flex-col gap-4">
      <ol className="relative flex flex-col gap-1">
        {/* The line the dots hang on, from the first dot to the last. */}
        <span
          aria-hidden="true"
          className="absolute top-5 bottom-5 left-[1.125rem] w-0.5 bg-border-strong"
        />
        {sections.map(({ heading }) => {
          // The section stays marked while the reader is on one of its h3s.
          const isActive = heading === current.heading && found !== -1;
          return (
            <li key={heading.id} className="relative">
              <a
                href={`#${heading.id}`}
                aria-current={heading.id === activeId ? "location" : undefined}
                className={cn(
                  "flex min-h-10 items-center gap-3 rounded-standard py-1.5 pr-3 pl-2 text-body-sm font-semibold transition-colors motion-reduce:transition-none",
                  focusRing,
                  isActive
                    ? "bg-accent-lime text-ink"
                    : "text-text-primary hover:bg-surface-sunken",
                )}
              >
                <span
                  aria-hidden="true"
                  data-dot=""
                  className={cn(
                    "relative flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-border-strong bg-surface-card",
                    isActive && "bg-accent-lime",
                  )}
                >
                  {isActive && (
                    <span className="size-2 rounded-full bg-border-strong" />
                  )}
                </span>
                <span className="min-w-0">{heading.text}</span>
              </a>
            </li>
          );
        })}
      </ol>

      {current && current.children.length > 0 && (
        <>
          <hr className="border-t-2 border-border-strong" />
          <section aria-labelledby={titleId} className="flex flex-col gap-2.5">
            <Text
              as="h2"
              id={titleId}
              size="heading-sm"
              weight="bold"
              className="flex items-center gap-2.5 font-display"
            >
              <span
                aria-hidden="true"
                className="flex size-9 shrink-0 items-center justify-center rounded-standard bg-accent-blue/50 text-text-primary"
              >
                <Box size={20} />
              </span>
              <span className="min-w-0">{current.heading.text}</span>
            </Text>
            <ol className="flex flex-col gap-1.5">
              {current.children.map((child, index) => {
                const isActive = child.id === activeId;
                return (
                  <li key={child.id}>
                    <a
                      href={`#${child.id}`}
                      aria-current={isActive ? "location" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-standard px-2 py-2 text-body-sm font-medium transition-colors motion-reduce:transition-none",
                        focusRing,
                        isActive
                          ? "bg-accent-lime/60 text-text-primary"
                          : "bg-surface-sunken text-text-primary hover:bg-accent-lime/30",
                      )}
                    >
                      <span
                        aria-hidden="true"
                        data-number=""
                        className="flex size-7 shrink-0 items-center justify-center rounded-sharp bg-accent-lime font-display text-sm font-bold text-ink"
                      >
                        {index + 1}
                      </span>
                      <span className="min-w-0">{child.text}</span>
                    </a>
                  </li>
                );
              })}
            </ol>
          </section>
        </>
      )}

      {next && (
        <div className="relative pt-2">
          <Ticks className="pointer-events-none absolute -top-3 -left-2 h-8 w-10" />
          <a
            href={`#${next.heading.id}`}
            className={cn(
              "flex min-h-12 items-center gap-2.5 rounded-standard border-2 border-border-strong bg-accent-lime px-3 font-display text-body-md font-bold text-ink shadow-raised transition-[translate,box-shadow] duration-150 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none motion-reduce:transition-none",
              focusRing,
            )}
          >
            <Tag aria-hidden="true" size={20} className="shrink-0" />
            <span className="min-w-0 flex-1">{next.heading.text}</span>
            <ArrowRight aria-hidden="true" size={20} className="shrink-0" />
            <span className="sr-only"> (mục tiếp theo)</span>
          </a>
        </div>
      )}
    </div>
  );
}

/**
 * Links to the headings of the article and marks the one being read. On wide
 * screens it is a card under a yellow folder tab "Nội dung bài viết", with the
 * h3 headings of the section being read below the sections and a lime button to
 * the next one. On narrow screens the same card is folded in a `<details>`.
 */
export function TableOfContents({ items }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>();

  useEffect(() => {
    if (items.length === 0) return;
    const headings = items
      .map((item) => document.getElementById(item.id))
      .filter((element): element is HTMLElement => element !== null);
    // The heading being read is the last one whose top has passed the reading
    // line. Unlike an IntersectionObserver (which only fires as a heading
    // crosses a band), this stays right in the middle of a long section and
    // when scrolling back up.
    const update = () => {
      let current: string | undefined;
      for (const heading of headings) {
        if (heading.getBoundingClientRect().top <= READING_LINE) {
          current = heading.id;
        } else {
          break;
        }
      }
      const root = document.documentElement;
      const isAtBottom =
        root.scrollHeight > window.innerHeight &&
        window.innerHeight + window.scrollY >= root.scrollHeight - 2;
      // A short last section never reaches the line: the end of the page counts.
      if (isAtBottom && headings.length > 0) {
        current = headings[headings.length - 1].id;
      }
      setActiveId(current);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [items]);

  if (items.length === 0) return null;

  const sections = groupToc(items);
  const card = (
    <div className="rounded-standard border-2 border-border-strong bg-surface-card p-3 shadow-raised lg:rounded-t-none lg:rounded-b-[1.25rem] lg:p-4 lg:shadow-[6px_6px_0_0_var(--color-border-strong)]">
      <TocBody sections={sections} activeId={activeId} />
    </div>
  );

  return (
    <nav aria-label="Mục lục">
      <details className="lg:hidden">
        <summary className="flex min-h-11 cursor-pointer items-center rounded-standard border-2 border-border-strong bg-accent-yellow px-4 font-display font-bold text-ink">
          Nội dung bài viết
        </summary>
        <div className="mt-2">{card}</div>
      </details>
      <div className="hidden lg:block">
        <div className="relative z-10 -mb-0.5 w-fit">
          <span className="inline-flex min-h-12 items-center gap-2.5 rounded-t-[1rem] border-2 border-b-0 border-border-strong bg-accent-yellow px-4 font-display text-body-lg font-bold text-ink">
            <Layers aria-hidden="true" size={22} />
            Nội dung bài viết
          </span>
          <Ticks
            corner="top-right"
            className="pointer-events-none absolute bottom-full left-full -mb-1 -ml-1 h-9 w-11"
          />
        </div>
        {card}
      </div>
    </nav>
  );
}
