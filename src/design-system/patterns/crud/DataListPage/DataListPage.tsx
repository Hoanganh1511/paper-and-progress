"use client";

import { type ComponentProps, type ReactNode } from "react";
import { Inbox } from "lucide-react";
import { cn } from "../../../utils/cn";
import { Inline, Stack, Text } from "../../../primitives";
import {
  Badge,
  Button,
  Checkbox,
  EmptyState,
  ErrorState,
  Pagination,
  SearchInput,
  Skeleton,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  type PaginationProps,
  type TableProps,
} from "../../../components";

export interface DataListColumn<T> {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  /** Makes the heading a sort button (see `sort` / `onSortChange`). */
  sortable?: boolean;
  className?: string;
}

export interface DataListSort {
  columnId: string;
  direction: "ascending" | "descending";
}

export interface DataListFilter {
  id: string;
  label: string;
}

export interface DataListPageLabels {
  search: string;
  searchPlaceholder: string;
  selectAll: string;
  /** `{name}` is replaced with the row's label. */
  selectRow: string;
  /** `{count}` is replaced with the number of selected rows. */
  selected: string;
  clearSelection: string;
  bulkActions: string;
  /** `{label}` is replaced with the filter's label. */
  removeFilter: string;
  clearFilters: string;
  activeFilters: string;
  actionsColumn: string;
  table: string;
  loading: string;
  emptyTitle: string;
  emptyDescription: string;
  errorTitle: string;
  pagination: Partial<NonNullable<PaginationProps["labels"]>>;
}

export const defaultDataListPageLabels: DataListPageLabels = {
  search: "Search",
  searchPlaceholder: "Search…",
  selectAll: "Select all rows",
  selectRow: "Select {name}",
  selected: "{count} selected",
  clearSelection: "Clear selection",
  bulkActions: "Bulk actions",
  removeFilter: "Remove filter {label}",
  clearFilters: "Clear all filters",
  activeFilters: "Active filters",
  actionsColumn: "Actions",
  table: "Data table",
  loading: "Loading",
  emptyTitle: "Nothing to show",
  emptyDescription: "No items match yet. Try changing your search or filters.",
  errorTitle: "Could not load the list",
  pagination: {},
};

const SKELETON_ROWS = 5;

export interface DataListPageProps<T> extends Omit<
  ComponentProps<"section">,
  "title"
> {
  title: ReactNode;
  description?: ReactNode;
  /** Page-level actions, e.g. a "New project" button. */
  actions?: ReactNode;

  columns: Array<DataListColumn<T>>;
  /** The rows of the current page. */
  rows: T[];
  getRowId: (row: T) => string;
  /** Name used in each row's checkbox label; defaults to the row id. */
  getRowLabel?: (row: T) => string;
  /** Per-row actions (edit, delete, a menu, ...), shown in the last column. */
  rowActions?: (row: T) => ReactNode;

  /** Search: shown when `onSearchChange` is given. */
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  /** Extra filter controls (selects, toggles) next to the search. */
  filters?: ReactNode;
  /** Filters currently applied, shown as removable badges. */
  activeFilters?: DataListFilter[];
  onRemoveFilter?: (id: string) => void;
  onClearFilters?: () => void;

  sort?: DataListSort;
  /** Called with the next sort: ascending, then descending, then `undefined` (none). */
  onSortChange?: (sort: DataListSort | undefined) => void;

  /** Adds a checkbox column. Selection is controlled through `selectedIds`. */
  selectable?: boolean;
  selectedIds?: string[];
  onSelectedIdsChange?: (ids: string[]) => void;
  /** Buttons shown while rows are selected; receives the selected ids. */
  bulkActions?: ReactNode | ((selectedIds: string[]) => ReactNode);

  /** Pagination is shown when there is more than one page. */
  page?: number;
  pageCount?: number;
  onPageChange?: (page: number) => void;

  isLoading?: boolean;
  /** Shown with a retry button instead of the table when loading failed. */
  error?: ReactNode;
  onRetry?: () => void;
  /** Replaces the default empty state. */
  emptyState?: ReactNode;

  tableOptions?: Pick<TableProps, "striped" | "hoverable" | "compact">;
  /** Replace any of the texts (translations). */
  labels?: Partial<DataListPageLabels>;
}

function fill(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

/**
 * A complete list screen: heading and actions, search and filters, a sortable
 * table with optional row selection and bulk actions, loading, error and empty
 * states, and pagination. It owns no data: rows, sort, selection, search and
 * page all come in as props and go out as callbacks, so fetching and
 * server-side filtering stay with the caller.
 */
export function DataListPage<T>({
  title,
  description,
  actions,
  columns,
  rows,
  getRowId,
  getRowLabel,
  rowActions,
  searchValue = "",
  onSearchChange,
  filters,
  activeFilters = [],
  onRemoveFilter,
  onClearFilters,
  sort,
  onSortChange,
  selectable = false,
  selectedIds = [],
  onSelectedIdsChange,
  bulkActions,
  page,
  pageCount,
  onPageChange,
  isLoading = false,
  error,
  onRetry,
  emptyState,
  tableOptions,
  labels: labelOverrides,
  className,
  ref,
  ...props
}: DataListPageProps<T>) {
  const labels = { ...defaultDataListPageLabels, ...labelOverrides };
  const rowIds = rows.map(getRowId);
  const selectedOnPage = rowIds.filter((id) => selectedIds.includes(id));
  const areAllSelected =
    rows.length > 0 && selectedOnPage.length === rows.length;
  const areSomeSelected = selectedOnPage.length > 0 && !areAllSelected;
  const columnCount =
    columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0);
  const hasToolbar = Boolean(onSearchChange || filters);
  const hasError = error !== undefined && error !== null && error !== false;

  function handleSort(columnId: string) {
    if (!onSortChange) return;
    if (sort?.columnId !== columnId) {
      onSortChange({ columnId, direction: "ascending" });
    } else if (sort.direction === "ascending") {
      onSortChange({ columnId, direction: "descending" });
    } else {
      onSortChange(undefined);
    }
  }

  function toggleAllOnPage() {
    if (!onSelectedIdsChange) return;
    onSelectedIdsChange(
      areAllSelected
        ? selectedIds.filter((id) => !rowIds.includes(id))
        : [...selectedIds, ...rowIds.filter((id) => !selectedIds.includes(id))],
    );
  }

  function toggleRow(id: string) {
    if (!onSelectedIdsChange) return;
    onSelectedIdsChange(
      selectedIds.includes(id)
        ? selectedIds.filter((selectedId) => selectedId !== id)
        : [...selectedIds, id],
    );
  }

  const bulkContent =
    typeof bulkActions === "function" ? bulkActions(selectedIds) : bulkActions;

  function renderBody() {
    if (isLoading) {
      return Array.from({ length: SKELETON_ROWS }, (_, index) => (
        <TableRow key={index}>
          <TableCell colSpan={columnCount}>
            <Skeleton />
          </TableCell>
        </TableRow>
      ));
    }
    return rows.map((row) => {
      const id = getRowId(row);
      const isSelected = selectedIds.includes(id);
      return (
        <TableRow
          key={id}
          data-selected={isSelected || undefined}
          className="data-[selected]:bg-surface-sunken"
        >
          {selectable && (
            <TableCell className="w-11">
              <Checkbox
                aria-label={fill(labels.selectRow, {
                  name: getRowLabel?.(row) ?? id,
                })}
                checked={isSelected}
                onChange={() => toggleRow(id)}
              />
            </TableCell>
          )}
          {columns.map((column) => (
            <TableCell key={column.id} className={column.className}>
              {column.cell(row)}
            </TableCell>
          ))}
          {rowActions && (
            <TableCell className="w-px whitespace-nowrap">
              <Inline gap={1} justify="end" wrap={false}>
                {rowActions(row)}
              </Inline>
            </TableCell>
          )}
        </TableRow>
      );
    });
  }

  return (
    <section
      ref={ref}
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      <Inline justify="between" align="start" gap={4}>
        <Stack gap={1}>
          <Text as="h1" size="heading-lg" weight="semibold">
            {title}
          </Text>
          {description && (
            <Text size="body-md" color="secondary">
              {description}
            </Text>
          )}
        </Stack>
        {actions}
      </Inline>

      {hasToolbar && (
        <Inline gap={3} align="center">
          {onSearchChange && (
            <div role="search" className="min-w-48 flex-1 sm:max-w-sm">
              <SearchInput
                aria-label={labels.search}
                placeholder={labels.searchPlaceholder}
                value={searchValue}
                onChange={(event) => onSearchChange(event.target.value)}
                onClear={() => onSearchChange("")}
              />
            </div>
          )}
          {filters}
        </Inline>
      )}

      {activeFilters.length > 0 && (
        <Inline gap={2} role="group" aria-label={labels.activeFilters}>
          {activeFilters.map((filter) => (
            <Badge
              key={filter.id}
              variant="blue"
              removable={Boolean(onRemoveFilter)}
              removeLabel={fill(labels.removeFilter, { label: filter.label })}
              onRemove={() => onRemoveFilter?.(filter.id)}
            >
              {filter.label}
            </Badge>
          ))}
          {onClearFilters && (
            <Button variant="ghost" size="compact" onClick={onClearFilters}>
              {labels.clearFilters}
            </Button>
          )}
        </Inline>
      )}

      {selectable && selectedIds.length > 0 && (
        <div
          role="region"
          aria-label={labels.bulkActions}
          className="flex flex-wrap items-center gap-3 rounded-standard border border-border-default bg-surface-sunken px-4 py-2"
        >
          <Text size="body-md" weight="medium" aria-live="polite">
            {fill(labels.selected, { count: selectedIds.length })}
          </Text>
          {bulkContent}
          <Button
            variant="ghost"
            size="compact"
            className="ml-auto"
            onClick={() => onSelectedIdsChange?.([])}
          >
            {labels.clearSelection}
          </Button>
        </div>
      )}

      {hasError ? (
        <ErrorState
          title={labels.errorTitle}
          message={error}
          onRetry={onRetry}
          titleAs="h2"
        />
      ) : !isLoading && rows.length === 0 ? (
        (emptyState ?? (
          <EmptyState
            icon={Inbox}
            title={labels.emptyTitle}
            description={labels.emptyDescription}
            titleAs="h2"
          />
        ))
      ) : (
        <Table aria-busy={isLoading || undefined} {...tableOptions}>
          <TableCaption className="sr-only">
            {typeof title === "string" ? title : labels.table}
          </TableCaption>
          <TableHeader>
            <TableRow>
              {selectable && (
                <TableHead className="w-11">
                  <Checkbox
                    aria-label={labels.selectAll}
                    checked={areAllSelected}
                    indeterminate={areSomeSelected}
                    disabled={isLoading || rows.length === 0}
                    onChange={toggleAllOnPage}
                  />
                </TableHead>
              )}
              {columns.map((column) => (
                <TableHead
                  key={column.id}
                  sortable={column.sortable && Boolean(onSortChange)}
                  sortDirection={
                    sort?.columnId === column.id ? sort.direction : "none"
                  }
                  onSort={() => handleSort(column.id)}
                  className={column.className}
                >
                  {column.header}
                </TableHead>
              ))}
              {rowActions && (
                <TableHead>
                  <span className="sr-only">{labels.actionsColumn}</span>
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>{renderBody()}</TableBody>
        </Table>
      )}

      {isLoading && (
        <span role="status" className="sr-only">
          {labels.loading}
        </span>
      )}

      {page !== undefined &&
        pageCount !== undefined &&
        pageCount > 1 &&
        onPageChange && (
          <Pagination
            page={page}
            pageCount={pageCount}
            onPageChange={onPageChange}
            labels={labels.pagination}
          />
        )}
    </section>
  );
}
