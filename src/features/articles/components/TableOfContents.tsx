"use client";

import { useEffect, useState } from "react";
import { Text, cn } from "@/design-system";
import type { TocItem } from "../toc";

export interface TableOfContentsProps {
  items: TocItem[];
}

/** Links to the headings of the article; marks the one being read. Open on wide screens, a folded `<details>` on narrow ones. */
export function TableOfContents({ items }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>();

  useEffect(() => {
    if (items.length === 0) return;
    const headings = items
      .map((item) => document.getElementById(item.id))
      .filter((element): element is HTMLElement => element !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible) setActiveId(visible.target.id);
      },
      { rootMargin: "-80px 0px -70% 0px" },
    );
    headings.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  const list = (
    <ol className="flex flex-col gap-1">
      {items.map((item) => (
        <li key={item.id} className={cn(item.level === 3 && "pl-4")}>
          <a
            href={`#${item.id}`}
            aria-current={activeId === item.id ? "location" : undefined}
            className={cn(
              "block min-h-8 rounded-sharp px-2 py-1 text-body-sm hover:bg-surface-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-border-focus",
              activeId === item.id
                ? "bg-accent-lime font-semibold text-ink hover:bg-accent-lime"
                : "text-text-secondary",
            )}
          >
            {item.text}
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <nav aria-label="Mục lục">
      <details className="rounded-standard border-2 border-border-strong bg-surface-card p-3 shadow-raised lg:hidden">
        <summary className="min-h-11 cursor-pointer py-2 font-semibold">
          Mục lục
        </summary>
        {list}
      </details>
      <div className="hidden lg:block">
        <Text as="p" size="body-sm" weight="bold" className="mb-2">
          Mục lục
        </Text>
        {list}
      </div>
    </nav>
  );
}
