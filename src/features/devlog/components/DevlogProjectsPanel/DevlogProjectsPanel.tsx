"use client";

import {
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
} from "react";
import { Layers, Plus, Search, SearchX } from "lucide-react";
import {
  Button,
  EmptyState,
  IconButton,
  SearchInput,
  Text,
  cn,
  focusRingClasses,
} from "@/design-system";
import { formatDevlogDate } from "../../status";
import type { ProjectSummary } from "../../types";

export interface DevlogProjectsPanelProps extends Omit<
  ComponentProps<"section">,
  "ref" | "title"
> {
  /** Every project, before the search narrows the list. */
  projects: ProjectSummary[];
  /** Number of entries of all projects together. */
  totalEntries: number;
  /** The project the timeline is narrowed to; `null` for all of them. */
  selectedId: string | null;
  onSelectProject: (id: string | null) => void;
  query: string;
  onQueryChange: (query: string) => void;
  onCreate: () => void;
}

// Same pressed shape as the timeline cards: the selected one stays pushed in.
const CARD_CLASSES = cn(
  "flex w-full min-h-11 flex-col items-start gap-2 rounded-standard border-2 border-border-strong bg-surface-card p-3 text-left shadow-raised",
  "transition-transform duration-[var(--duration-fast)] motion-reduce:transition-none",
  "active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
  "aria-pressed:translate-x-0.5 aria-pressed:translate-y-0.5 aria-pressed:bg-accent-blue/20 aria-pressed:shadow-none",
  focusRingClasses,
);

function ProgressLine({ value }: { value: number }) {
  return (
    <span className="flex w-full items-center gap-2">
      <span
        aria-hidden="true"
        className="block h-1.5 flex-1 overflow-hidden rounded-pill border border-border-strong bg-surface-sunken"
      >
        <span
          className="block h-full bg-accent-blue"
          style={{ width: `${value}%` }}
        />
      </span>
      <Text as="span" size="caption" color="secondary">
        {value}% hoàn thành
      </Text>
    </span>
  );
}

/**
 * The projects column: a button to start a new one, a search, and a card per
 * project with its number of logs, how many are done or in progress, its
 * progress and its latest log. Choosing a card narrows the timeline to it;
 * choosing it again, or "Tất cả dự án", shows everything.
 */
export function DevlogProjectsPanel({
  projects,
  totalEntries,
  selectedId,
  onSelectProject,
  query,
  onQueryChange,
  onCreate,
  className,
  ...props
}: DevlogProjectsPanelProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isSearchOpen) searchRef.current?.focus();
  }, [isSearchOpen]);

  // Closing also clears the words, so a hidden search never filters the list.
  function closeSearch() {
    onQueryChange("");
    setIsSearchOpen(false);
    searchButtonRef.current?.focus();
  }

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeSearch();
    }
  }

  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const matches = projects.filter((project) => {
    const text = `${project.label} ${project.description ?? ""}`.toLowerCase();
    return words.every((word) => text.includes(word));
  });

  return (
    <section
      aria-labelledby="devlog-projects-title"
      className={cn("flex min-w-0 flex-col gap-4", className)}
      {...props}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Text
          as="h2"
          id="devlog-projects-title"
          size="heading-sm"
          weight="semibold"
        >
          Các dự án
        </Text>
        <div className="flex items-center gap-2">
          <IconButton
            ref={searchButtonRef}
            icon={Search}
            variant="outline"
            size="compact"
            aria-label="Tìm dự án"
            aria-expanded={isSearchOpen}
            onClick={() =>
              isSearchOpen ? closeSearch() : setIsSearchOpen(true)
            }
          />
          <Button
            variant="accent"
            size="compact"
            leftIcon={Plus}
            onClick={onCreate}
          >
            Dự án mới
          </Button>
        </div>
      </div>

      {isSearchOpen && (
        <SearchInput
          ref={searchRef}
          aria-label="Từ khoá dự án"
          placeholder="Tìm dự án"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          onKeyDown={handleSearchKeyDown}
          onBlur={(event) => {
            // Leaving an empty box puts the icon back; a box with words stays.
            if (!event.currentTarget.value && !event.relatedTarget) {
              setIsSearchOpen(false);
            }
          }}
          onClear={() => onQueryChange("")}
          clearLabel="Xoá từ khoá dự án"
        />
      )}

      <Text as="p" size="body-sm" color="secondary" role="status">
        {projects.length} dự án · {totalEntries} log
      </Text>

      <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-1">
        {!words.length && (
          <li>
            <button
              type="button"
              aria-pressed={selectedId === null}
              onClick={() => onSelectProject(null)}
              className={CARD_CLASSES}
            >
              <span className="flex items-center gap-2">
                <Layers aria-hidden="true" size={16} />
                <Text as="span" size="body-md" weight="semibold">
                  Tất cả dự án
                </Text>
              </span>
              <Text as="span" size="caption" color="secondary">
                {totalEntries} log · {projects.length} dự án
              </Text>
            </button>
          </li>
        )}
        {matches.map((project) => (
          <li key={project.id}>
            <button
              type="button"
              aria-pressed={selectedId === project.id}
              onClick={() =>
                onSelectProject(selectedId === project.id ? null : project.id)
              }
              className={CARD_CLASSES}
            >
              <Text
                as="span"
                size="body-md"
                weight="semibold"
                className="block"
              >
                {project.label}
              </Text>
              {project.description && (
                <Text
                  as="span"
                  size="body-sm"
                  color="secondary"
                  className="line-clamp-2 block"
                >
                  {project.description}
                </Text>
              )}
              <Text as="span" size="body-sm" color="secondary">
                {project.entryCount} log · {project.doneCount} hoàn thành ·{" "}
                {project.inProgressCount} đang làm
              </Text>
              <ProgressLine value={project.progress} />
              <Text as="span" size="caption" color="muted">
                {project.lastEntryAt
                  ? `Gần nhất ${formatDevlogDate(project.lastEntryAt)}`
                  : "Chưa có log"}
              </Text>
            </button>
          </li>
        ))}
      </ul>

      {words.length > 0 && matches.length === 0 && (
        <EmptyState
          icon={SearchX}
          title="Không có dự án phù hợp"
          description={`Không có kết quả cho “${query.trim()}”.`}
          action={
            <Button variant="outline" onClick={() => onQueryChange("")}>
              Xoá từ khoá
            </Button>
          }
        />
      )}
    </section>
  );
}
