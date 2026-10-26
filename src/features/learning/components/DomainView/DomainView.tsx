"use client";

import { useMemo, type ComponentProps } from "react";
import { Grid, Stack, Text, cn } from "@/design-system";
import { useScrollSpy } from "../../hooks";
import type { LearningDomain } from "../../types";
import { CategoryNav } from "../CategoryNav";
import { LearningItemCard } from "../LearningItemCard";

export interface DomainViewProps extends Omit<
  ComponentProps<"div">,
  "ref" | "children"
> {
  domain: LearningDomain;
}

const sectionIdOf = (domainId: string, categoryId: string) =>
  `${domainId}-${categoryId}`;

/**
 * The body of one domain: the category list on the left (a row above the
 * content on small screens) and, in `<main>`, every category in turn with
 * its items in a grid.
 *
 * The category buttons and the page scroll are kept in step: choosing a
 * button scrolls smoothly to that section and moves focus to its heading;
 * scrolling the page highlights the button of the section being read. The
 * sticky offsets and the sections' `scroll-mt-*` add the heights of what is
 * stuck above them: the tab bar (2.75rem) and, when there is one, the sticky
 * app header (`--app-header-height`), so a section's heading lands just
 * below them.
 * Mount it with a `key` per domain so the scroll state starts fresh.
 */
export function DomainView({ domain, className, ...props }: DomainViewProps) {
  const sectionIds = useMemo(
    () => domain.categories.map((c) => sectionIdOf(domain.id, c.id)),
    [domain],
  );
  const { activeId, goTo } = useScrollSpy(sectionIds);
  const activeCategoryId = domain.categories.find(
    (c) => sectionIdOf(domain.id, c.id) === activeId,
  )?.id;

  function handleSelect(categoryId: string) {
    const section = goTo(sectionIdOf(domain.id, categoryId));
    // Move focus to the heading so keyboard and screen reader users land there too.
    section?.querySelector<HTMLElement>("h2")?.focus({ preventScroll: true });
  }

  return (
    <div
      className={cn(
        "grid gap-4 py-4 md:grid-cols-[13rem_1fr] md:gap-10 md:py-8",
        className,
      )}
      {...props}
    >
      <CategoryNav
        aria-label={`Phân loại trong lĩnh vực ${domain.label}`}
        categories={domain.categories}
        activeId={activeCategoryId}
        onSelect={handleSelect}
        className="sticky top-[calc(var(--app-header-height,0px)+2.75rem)] z-[var(--z-sticky)] -mx-4 overflow-x-auto bg-surface-page px-4 py-1 sm:-mx-6 sm:px-6 md:top-[calc(var(--app-header-height,0px)+5rem)] md:z-auto md:mx-0 md:self-start md:overflow-visible md:bg-transparent md:px-0 md:py-0"
      />
      <main id="main-content" tabIndex={-1} className="min-w-0 outline-none">
        <Stack gap={12}>
          {domain.categories.map((category, index) => {
            const sectionId = sectionIdOf(domain.id, category.id);
            const isLast = index === domain.categories.length - 1;
            return (
              <section
                key={category.id}
                id={sectionId}
                aria-labelledby={`${sectionId}-heading`}
                className={cn(
                  "scroll-mt-[calc(var(--app-header-height,0px)+7rem)] md:scroll-mt-[calc(var(--app-header-height,0px)+5rem)]",
                  isLast && "md:min-h-[60dvh]",
                )}
              >
                <Stack gap={4}>
                  <Stack gap={1}>
                    <Text
                      as="h2"
                      id={`${sectionId}-heading`}
                      tabIndex={-1}
                      size="heading-lg"
                      weight="semibold"
                      className="outline-none"
                    >
                      {category.title}
                    </Text>
                    {category.description && (
                      <Text size="body-md" color="secondary">
                        {category.description}
                      </Text>
                    )}
                  </Stack>
                  <Grid columns={3} gap={4} role="list">
                    {category.items.map((entry) => (
                      <div key={entry.id} role="listitem" className="h-full">
                        <LearningItemCard item={entry} />
                      </div>
                    ))}
                  </Grid>
                </Stack>
              </section>
            );
          })}
        </Stack>
      </main>
    </div>
  );
}
