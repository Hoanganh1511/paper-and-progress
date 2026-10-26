"use client";

import { useEffect, useRef, type ComponentProps } from "react";
import { cn, focusRingClasses } from "@/design-system";
import type { LearningCategory } from "../../types";

export interface CategoryNavProps extends Omit<
  ComponentProps<"nav">,
  "onSelect" | "ref"
> {
  categories: Pick<LearningCategory, "id" | "title">[];
  /** Id of the category being read; its button is marked as the current location. */
  activeId?: string;
  onSelect: (categoryId: string) => void;
}

// Class names are written out in full so Tailwind can detect them statically.
// The current button is shown by the filled background and the bold label,
// not by color alone.
const buttonClasses = cn(
  "flex min-h-11 shrink-0 cursor-pointer items-center rounded-standard px-3 text-left font-body text-body-md font-medium whitespace-nowrap text-text-secondary transition-colors duration-[var(--duration-fast)]",
  "hover:bg-surface-sunken hover:text-text-primary md:w-full md:whitespace-normal",
  "aria-[current=location]:bg-accent-lime aria-[current=location]:font-semibold aria-[current=location]:text-ink",
  focusRingClasses,
);

/**
 * One button per category. A row that scrolls sideways on small screens and a
 * vertical list from `md` up. The caller decides what selecting does
 * (usually: scroll to the matching section).
 */
export function CategoryNav({
  categories,
  activeId,
  onSelect,
  className,
  ...props
}: CategoryNavProps) {
  const navRef = useRef<HTMLElement>(null);
  const previousActiveId = useRef(activeId);

  // Keep the current button visible when the row scrolls sideways.
  useEffect(() => {
    if (previousActiveId.current === activeId) return;
    previousActiveId.current = activeId;
    navRef.current
      ?.querySelector<HTMLElement>('[aria-current="location"]')
      ?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  }, [activeId]);

  return (
    <nav ref={navRef} className={cn(className)} {...props}>
      <ul className="flex gap-1 md:flex-col">
        {categories.map((category) => (
          <li key={category.id} className="md:w-full">
            <button
              type="button"
              aria-current={category.id === activeId ? "location" : undefined}
              className={buttonClasses}
              onClick={() => onSelect(category.id)}
            >
              {category.title}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
