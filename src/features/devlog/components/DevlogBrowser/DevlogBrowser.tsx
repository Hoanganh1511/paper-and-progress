"use client";

import { useMemo, useState, type ComponentProps } from "react";
import { useSearchParams } from "next/navigation";
import {
  BookOpen,
  ChevronDown,
  SearchX,
  Square,
  SquareCheck,
  X,
} from "lucide-react";
import {
  Button,
  DropdownMenu,
  EmptyState,
  MenuContent,
  MenuItem,
  MenuTrigger,
  SearchInput,
  Text,
  cn,
  countActiveFilters,
  focusRingClasses,
} from "@/design-system";
import { addCustomProject, useCustomProjects } from "../../customProjects";
import {
  DEVLOG_MODULES,
  STATUS_LABELS,
  computeProjectSummaries,
  filterEntries,
} from "../../status";
import type { DevlogEntry } from "../../types";
import { DevlogActivityList } from "../DevlogActivityList";
import { DevlogDetailPanel } from "../DevlogDetailPanel";
import { DevlogProjectDialog } from "../DevlogProjectDialog";
import { DevlogProjectsPanel } from "../DevlogProjectsPanel";

interface FilterOption {
  value: string;
  label: string;
  count: number;
}

interface FilterGroup {
  id: "status" | "tag";
  label: string;
  options: FilterOption[];
}

type FilterValue = Record<string, string[]>;

/**
 * The page fits one screen, so from `lg` each area fills the height it is
 * given and scrolls on its own; below `lg` the whole body scrolls instead.
 * `overflow-y-auto` also clips sideways, so the padding leaves room inside
 * the area for what is drawn outside the cards' boxes: hard shadows, focus
 * outlines and the timeline dots that straddle the rule.
 */
const PANE = "lg:h-full lg:min-h-0 lg:overflow-y-auto lg:p-3";

function buildGroups(entries: DevlogEntry[]): FilterGroup[] {
  const tags = new Map<string, number>();
  for (const entry of entries) {
    for (const tag of entry.tags) tags.set(tag, (tags.get(tag) ?? 0) + 1);
  }

  return [
    {
      id: "status",
      label: "Trạng thái",
      options: Object.entries(STATUS_LABELS).map(([value, label]) => ({
        value,
        label,
        count: entries.filter((entry) => entry.status === value).length,
      })),
    },
    {
      id: "tag",
      label: "Tag",
      options: [...tags.keys()]
        .sort((a, b) => a.localeCompare(b))
        .map((tag) => ({
          value: tag,
          label: `#${tag}`,
          count: tags.get(tag) ?? 0,
        })),
    },
  ];
}

function optionLabel(
  groupId: string,
  value: string,
  projectLabels: Map<string, string>,
) {
  if (groupId === "module") return projectLabels.get(value) ?? value;
  if (groupId === "status") {
    return STATUS_LABELS[value as keyof typeof STATUS_LABELS] ?? value;
  }
  return `#${value}`;
}

export interface DevlogBrowserProps extends Omit<
  ComponentProps<"div">,
  "children"
> {
  /** Newest first. */
  entries: DevlogEntry[];
}

/**
 * The devlog page body: three areas. The projects column lists the projects
 * with their numbers (choosing one narrows the timeline to it, and a new one
 * can be started); the timeline holds the search, the filters and the matching
 * entries; the right one shows the selected entry in full, so reading never
 * leaves the timeline. The selection is kept in the URL (`?entry=slug`) so an entry can
 * be linked to. It fills the height it is given and never scrolls as a whole
 * from `lg`; on small screens the panes are two views with a back button.
 */
export function DevlogBrowser({
  entries,
  className,
  ...props
}: DevlogBrowserProps) {
  const initialSlug = useSearchParams().get("entry");
  const [filters, setFilters] = useState<FilterValue>({});
  const [query, setQuery] = useState("");
  const [projectQuery, setProjectQuery] = useState("");
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState(initialSlug);
  const [isDetailOpen, setIsDetailOpen] = useState(initialSlug !== null);

  const customProjects = useCustomProjects();
  const projects = useMemo(
    () =>
      computeProjectSummaries(entries, [...DEVLOG_MODULES, ...customProjects]),
    [entries, customProjects],
  );
  const projectLabels = useMemo(
    () => new Map(projects.map((project) => [project.id, project.label])),
    [projects],
  );
  const groups = useMemo(() => buildGroups(entries), [entries]);
  const matches = useMemo(
    () => filterEntries(entries, { ...filters, query }),
    [entries, filters, query],
  );
  // A selection hidden by the filters gives way to the newest match.
  const selected =
    matches.find((entry) => entry.slug === selectedSlug) ?? matches[0];

  const chips = Object.entries(filters).flatMap(([groupId, values]) =>
    values.map((value) => ({
      key: `${groupId}:${value}`,
      label: optionLabel(groupId, value, projectLabels),
      remove: () =>
        setFilters((current) => ({
          ...current,
          [groupId]: (current[groupId] ?? []).filter((v) => v !== value),
        })),
    })),
  );
  const hasFilters = countActiveFilters(filters) > 0 || query.trim() !== "";

  function toggleFilter(groupId: string, value: string) {
    setFilters((current) => {
      const values = current[groupId] ?? [];
      return {
        ...current,
        [groupId]: values.includes(value)
          ? values.filter((v) => v !== value)
          : [...values, value],
      };
    });
  }

  const selectedProjectId =
    filters.module?.length === 1 ? filters.module[0] : null;

  function selectProject(id: string | null) {
    setFilters((current) => ({ ...current, module: id ? [id] : [] }));
    setIsDetailOpen(false);
  }

  function createProject(project: {
    id: string;
    label: string;
    description?: string;
  }) {
    addCustomProject(project);
    setIsProjectDialogOpen(false);
    selectProject(project.id);
  }

  function clearFilters() {
    setFilters({});
    setQuery("");
  }

  function select(slug: string) {
    setSelectedSlug(slug);
    setIsDetailOpen(true);
    window.history.replaceState(null, "", `?entry=${encodeURIComponent(slug)}`);
  }

  function filterModule(moduleId: string) {
    setFilters((current) => ({ ...current, module: [moduleId] }));
    setIsDetailOpen(false);
  }

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Hành trình của bạn bắt đầu từ đây"
        description="Chưa có entry nào. Thêm một file markdown vào content/devlog để bắt đầu."
      />
    );
  }

  return (
    <div className={cn("h-full min-h-0", className)} {...props}>
      <div className="flex h-full min-h-0 flex-col gap-6 overflow-y-auto lg:grid lg:grid-cols-[16rem_minmax(0,1fr)_minmax(0,1.2fr)] lg:grid-rows-[minmax(0,1fr)] lg:overflow-hidden xl:grid-cols-[18rem_minmax(0,1fr)_minmax(0,1fr)]">
        <div
          className={cn(
            "min-w-0 rounded-standard lg:block",
            isDetailOpen ? "hidden" : "block",
            PANE,
          )}
        >
          <DevlogProjectsPanel
            projects={projects}
            totalEntries={entries.length}
            selectedId={selectedProjectId}
            onSelectProject={selectProject}
            query={projectQuery}
            onQueryChange={setProjectQuery}
            onCreate={() => setIsProjectDialogOpen(true)}
          />
        </div>

        <section
          aria-label="Dòng thời gian"
          tabIndex={0}
          className={cn(
            "min-w-0 flex-col gap-4 rounded-standard lg:flex [&>*]:shrink-0",
            isDetailOpen ? "hidden" : "flex",
            PANE,
            focusRingClasses,
          )}
        >
          <div
            role="group"
            aria-label="Bộ lọc nhật ký"
            className="flex flex-wrap items-center gap-2"
          >
            <SearchInput
              aria-label="Tìm trong nhật ký"
              placeholder="Tìm theo tiêu đề, nội dung, tag"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onClear={() => setQuery("")}
              clearLabel="Xoá từ khoá"
              className="min-w-48 flex-1"
            />
            {groups.map((group, index) => {
              const selectedValues = filters[group.id] ?? [];
              return (
                <DropdownMenu key={group.id}>
                  <MenuTrigger>
                    <Button
                      variant="outline"
                      rightIcon={ChevronDown}
                      aria-label={
                        selectedValues.length > 0
                          ? `${group.label}, ${selectedValues.length} đã chọn`
                          : group.label
                      }
                    >
                      {group.label}
                      {selectedValues.length > 0 &&
                        ` · ${selectedValues.length}`}
                    </Button>
                  </MenuTrigger>
                  <MenuContent
                    aria-label={group.label}
                    align={index === groups.length - 1 ? "end" : "start"}
                    className="max-h-64 overflow-y-auto"
                  >
                    {group.options.map((option) => {
                      const isChecked = selectedValues.includes(option.value);
                      return (
                        <MenuItem
                          key={option.value}
                          role="menuitemcheckbox"
                          aria-checked={isChecked}
                          icon={isChecked ? SquareCheck : Square}
                          shortcut={String(option.count)}
                          onClick={(event) => {
                            // Keeps the menu open so several can be picked.
                            event.preventDefault();
                            toggleFilter(group.id, option.value);
                          }}
                        >
                          {option.label}
                        </MenuItem>
                      );
                    })}
                  </MenuContent>
                </DropdownMenu>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Text as="p" size="body-sm" color="secondary" role="status">
              {matches.length} / {entries.length} entry
            </Text>
            {chips.map((chip) => (
              <Button
                key={chip.key}
                variant="secondary"
                size="compact"
                rightIcon={X}
                aria-label={`Bỏ lọc ${chip.label}`}
                onClick={chip.remove}
              >
                {chip.label}
              </Button>
            ))}
            {hasFilters && (
              <Button variant="ghost" size="compact" onClick={clearFilters}>
                Xoá tất cả
              </Button>
            )}
          </div>

          {matches.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="Không có entry phù hợp"
              description={
                query.trim()
                  ? `Không có kết quả cho “${query.trim()}”. Thử từ khoá khác hoặc bỏ bớt bộ lọc.`
                  : "Thử bỏ bớt dự án, trạng thái hoặc tag."
              }
              action={
                hasFilters ? (
                  <Button variant="outline" onClick={clearFilters}>
                    Bỏ lọc
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <DevlogActivityList
              entries={matches}
              selectedSlug={selected?.slug}
              onSelectEntry={select}
            />
          )}
        </section>

        {selected ? (
          <div
            role="region"
            aria-label="Chi tiết entry"
            tabIndex={0}
            className={cn(
              "min-w-0 rounded-standard lg:block",
              isDetailOpen ? "block" : "hidden",
              PANE,
              focusRingClasses,
            )}
          >
            <DevlogDetailPanel
              entry={selected}
              onFilterModule={filterModule}
              onBack={() => setIsDetailOpen(false)}
            />
          </div>
        ) : (
          <div
            className={cn(
              "min-w-0 lg:block",
              isDetailOpen ? "block" : "hidden",
            )}
          >
            <EmptyState
              icon={BookOpen}
              title="Chưa có entry để xem"
              description="Chọn dự án khác hoặc bỏ bớt bộ lọc."
            />
          </div>
        )}
      </div>

      <DevlogProjectDialog
        open={isProjectDialogOpen}
        onClose={() => setIsProjectDialogOpen(false)}
        onCreate={createProject}
        existingLabels={projects.map((project) => project.label)}
      />
    </div>
  );
}
