"use client";

import { useMemo, useState, type ComponentProps } from "react";
import { SearchX } from "lucide-react";
import {
  Button,
  EmptyState,
  FilterPanel,
  Text,
  cn,
  countActiveFilters,
  type FilterGroup,
  type FilterValue,
} from "@/design-system";
import { DEVLOG_MODULES, filterEntries } from "../../status";
import type { DevlogEntry, ProjectStatus } from "../../types";
import { DevlogTimeline } from "../DevlogTimeline";
import { ProjectStatusPanel } from "../ProjectStatusPanel";

const FILTER_PANEL_LABELS = {
  panel: "Bộ lọc devlog",
  clearAll: "Xoá bộ lọc",
  selectedCount: "{count} đã chọn",
};

function buildGroups(entries: DevlogEntry[]): FilterGroup[] {
  const tags = new Map<string, number>();
  for (const entry of entries) {
    for (const tag of entry.tags) tags.set(tag, (tags.get(tag) ?? 0) + 1);
  }

  return [
    {
      id: "module",
      label: "Module",
      options: DEVLOG_MODULES.map((module) => ({
        value: module.id,
        label: module.label,
        count: entries.filter((entry) => entry.module === module.id).length,
      })),
    },
    {
      id: "tag",
      label: "Tag",
      display: "chips",
      options: [...tags.keys()]
        .sort((a, b) => a.localeCompare(b))
        .map((tag) => ({ value: tag, label: `#${tag}` })),
    },
  ];
}

export interface DevlogBrowserProps extends Omit<
  ComponentProps<"div">,
  "children"
> {
  entries: DevlogEntry[];
  status: ProjectStatus;
}

/**
 * The devlog page body: the project overview and the module / tag filters in
 * a column on the left (above the timeline on small screens), and the
 * timeline of the matching entries on the right.
 */
export function DevlogBrowser({
  entries,
  status,
  className,
  ...props
}: DevlogBrowserProps) {
  const [filters, setFilters] = useState<FilterValue>({});
  const groups = useMemo(() => buildGroups(entries), [entries]);
  const matches = useMemo(
    () => filterEntries(entries, filters),
    [entries, filters],
  );

  return (
    <div
      className={cn(
        "grid items-start gap-8 lg:grid-cols-[18rem_1fr]",
        className,
      )}
      {...props}
    >
      <aside
        aria-label="Tổng quan và bộ lọc"
        className="flex flex-col gap-6 lg:sticky lg:top-[calc(var(--app-header-height,0px)+1rem)]"
      >
        <ProjectStatusPanel status={status} />
        <FilterPanel
          groups={groups}
          value={filters}
          onValueChange={setFilters}
          labels={FILTER_PANEL_LABELS}
        />
      </aside>

      <section aria-labelledby="devlog-timeline-title" className="min-w-0">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <Text
            as="h2"
            id="devlog-timeline-title"
            size="heading-md"
            weight="semibold"
          >
            Dòng thời gian
          </Text>
          <Text as="p" size="body-sm" color="secondary" role="status">
            {matches.length} / {entries.length} entry
          </Text>
        </div>

        {matches.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="Không có entry phù hợp"
            description="Thử bỏ bớt module hoặc tag."
            action={
              countActiveFilters(filters) > 0 ? (
                <Button variant="outline" onClick={() => setFilters({})}>
                  Xoá bộ lọc
                </Button>
              ) : undefined
            }
          />
        ) : (
          <DevlogTimeline entries={matches} titleAs="h3" />
        )}
      </section>
    </div>
  );
}
