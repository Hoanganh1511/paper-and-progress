"use client";

import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import {
  Alert,
  AlertDialog,
  Badge,
  Button,
  Card,
  DropdownMenu,
  IconButton,
  MenuContent,
  MenuItem,
  MenuTrigger,
  SearchInput,
  Skeleton,
  Text,
  cn,
} from "@/design-system";
import {
  useAdminQuery,
  useDebouncedValue,
} from "@/features/admin/useAdminQuery";
import { useDashboard } from "../DashboardContext";
import { ISSUE_BADGE_VARIANT, ISSUE_LABELS, STATUS_ICONS } from "../display";
import {
  deleteCategory,
  getCriteria,
  getIssues,
  reorderCategories,
} from "../projectDashboardApi";
import type {
  Category,
  CriteriaStatus,
  CriterionListItem,
  DashboardFilter,
  IssueItem,
} from "../types";
import { CategoryFormDialog } from "./CategoryFormDialog";
import { CollapseToggle, useCollapse } from "./CollapseToggle";
import { CategoryRow, CriteriaRows } from "./CategoryRow";
import { CriteriaFormDialog } from "./CriteriaFormDialog";
import { ModuleError } from "./ModuleError";

type Dialog =
  | { kind: "criterion"; categoryId?: string }
  | { kind: "category"; category?: Category }
  | { kind: "delete"; category: Category };

const STATUS_FILTERS: {
  status: CriteriaStatus;
  label: string;
  key: keyof Category["stats"];
}[] = [
  { status: "COMPLETED", label: "Hoàn thành", key: "completed" },
  { status: "IN_PROGRESS", label: "Đang thực hiện", key: "inProgress" },
  { status: "NOT_STARTED", label: "Chưa bắt đầu", key: "notStarted" },
  { status: "BLOCKED", label: "Bị chặn", key: "blocked" },
];

const STATS_KEY_FOR_STATUS: Record<CriteriaStatus, keyof Category["stats"]> = {
  COMPLETED: "completed",
  IN_PROGRESS: "inProgress",
  NOT_STARTED: "notStarted",
  BLOCKED: "blocked",
};

const FILTER_EMPTY = "Không có kết quả phù hợp với bộ lọc";

/** Module C: search, the status filter and the category accordion with each category's criteria. */
export function CriteriaModule() {
  const { filter, setFilter, search, setSearch, categories } = useDashboard();
  const [dialog, setDialog] = useState<Dialog>();
  const collapse = useCollapse();
  const debouncedSearch = useDebouncedValue(search.trim());
  const list = categories.data;

  const totals = useMemo(() => {
    const sum = {
      total: 0,
      completed: 0,
      inProgress: 0,
      notStarted: 0,
      blocked: 0,
    };
    for (const category of list ?? []) {
      for (const key of Object.keys(sum) as (keyof typeof sum)[]) {
        sum[key] += category.stats[key];
      }
    }
    return sum;
  }, [list]);

  const status = filter.kind === "status" ? filter.status : undefined;
  const isIssueMode = filter.kind === "issue";
  const isSearchMode = !isIssueMode && debouncedSearch !== "";

  return (
    <Card
      as="section"
      aria-labelledby="criteria-title"
      variant="elevated"
      className="gap-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Text
          as="h2"
          id="criteria-title"
          weight="bold"
          className="text-[20px] leading-tight"
        >
          Danh sách tính năng & tiêu chí
        </Text>
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            aria-label="Tìm tiêu chí"
            placeholder="Tìm tiêu chí..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onClear={() => setSearch("")}
            className="h-9 w-[220px]"
          />
          <Button
            variant="accent"
            size="compact"
            leftIcon={Plus}
            onClick={() => setDialog({ kind: "criterion" })}
          >
            Thêm tiêu chí
          </Button>
          <CollapseToggle
            collapse={collapse}
            title="Danh sách tính năng & tiêu chí"
          />
        </div>
      </div>

      <div
        id={collapse.bodyId}
        hidden={collapse.isCollapsed}
        className="flex flex-col gap-4"
      >
        <div
          role="group"
          aria-label="Lọc theo trạng thái"
          className="flex flex-wrap gap-2"
        >
          <FilterButton
            isActive={filter.kind === "all"}
            onClick={() => setFilter({ kind: "all" })}
          >
            Tất cả ({totals.total})
          </FilterButton>
          {STATUS_FILTERS.map((item) => (
            <FilterButton
              key={item.status}
              isActive={status === item.status}
              onClick={() => setFilter({ kind: "status", status: item.status })}
            >
              {item.label} ({totals[item.key]})
            </FilterButton>
          ))}
        </div>

        {isIssueMode ? (
          <IssueResults filter={filter} search={debouncedSearch} />
        ) : !list && categories.error ? (
          <ModuleError error={categories.error} onRetry={categories.reload} />
        ) : !list ? (
          <ListSkeleton />
        ) : isSearchMode ? (
          <SearchResults
            categories={list}
            search={debouncedSearch}
            status={status}
            renderMenu={(category) => (
              <CategoryMenu
                category={category}
                categories={list}
                onDialog={setDialog}
              />
            )}
            onAddCriterion={(categoryId) =>
              setDialog({ kind: "criterion", categoryId })
            }
          />
        ) : (
          <CategoryAccordion
            categories={list}
            status={status}
            onDialog={setDialog}
          />
        )}
      </div>

      {dialog?.kind === "criterion" && list && (
        <CriteriaFormDialog
          categories={list}
          categoryId={dialog.categoryId}
          onClose={() => setDialog(undefined)}
        />
      )}
      {dialog?.kind === "category" && (
        <CategoryFormDialog
          category={dialog.category}
          onClose={() => setDialog(undefined)}
        />
      )}
      {dialog?.kind === "delete" && (
        <DeleteCategoryDialog
          category={dialog.category}
          onClose={() => setDialog(undefined)}
        />
      )}
    </Card>
  );
}

function FilterButton({
  isActive,
  onClick,
  children,
}: {
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={isActive}
      onClick={onClick}
      className={cn(
        "h-8 cursor-pointer rounded-standard border px-3 text-[12px] font-semibold transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-border-focus",
        isActive
          ? "border-2 border-border-strong bg-accent-yellow text-ink"
          : "border-[#d4d4d4] bg-surface-card text-text-primary hover:bg-surface-sunken",
      )}
    >
      {children}
    </button>
  );
}

function ListSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-2">
      <span role="status" className="sr-only">
        Đang tải
      </span>
      {Array.from({ length: 6 }, (_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Browse: all categories, criteria loaded when a category opens              */
/* -------------------------------------------------------------------------- */

function CategoryAccordion({
  categories,
  status,
  onDialog,
}: {
  categories: Category[];
  status?: CriteriaStatus;
  onDialog: (dialog: Dialog) => void;
}) {
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const visible = status
    ? categories.filter(
        (category) => category.stats[STATS_KEY_FOR_STATUS[status]] > 0,
      )
    : categories;

  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <Text color="secondary">Chưa có tiêu chí nào</Text>
        <Button
          variant="outline"
          size="compact"
          leftIcon={Plus}
          onClick={() => onDialog({ kind: "category" })}
        >
          Thêm danh mục
        </Button>
      </div>
    );
  }
  if (visible.length === 0) {
    return (
      <Text color="secondary" className="py-8 text-center">
        {FILTER_EMPTY}
      </Text>
    );
  }

  function toggle(id: string) {
    setExpanded((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-1.5">
        {visible.map((category) => (
          <CategoryRow
            key={category.id}
            category={category}
            isExpanded={expanded.has(category.id)}
            onToggle={() => toggle(category.id)}
            menu={
              <CategoryMenu
                category={category}
                categories={categories}
                onDialog={onDialog}
              />
            }
            onAddCriterion={() =>
              onDialog({ kind: "criterion", categoryId: category.id })
            }
          >
            <CategoryCriteria categoryId={category.id} status={status} />
          </CategoryRow>
        ))}
      </ul>
      <div>
        <Button
          variant="outline"
          size="compact"
          leftIcon={Plus}
          onClick={() => onDialog({ kind: "category" })}
        >
          Thêm danh mục
        </Button>
      </div>
    </div>
  );
}

function CategoryCriteria({
  categoryId,
  status,
}: {
  categoryId: string;
  status?: CriteriaStatus;
}) {
  const { version } = useDashboard();
  const query = useAdminQuery(
    () => getCriteria({ categoryId, status, limit: 200 }),
    `category-${categoryId}-${status ?? "all"}-${version}`,
  );
  if (query.error && !query.data) {
    return <ModuleError error={query.error} onRetry={query.reload} />;
  }
  if (!query.data) {
    return (
      <Text
        role="status"
        size="body-sm"
        color="secondary"
        className="px-2 py-2"
      >
        Đang tải...
      </Text>
    );
  }
  return <CriteriaRows items={query.data.items} />;
}

/* -------------------------------------------------------------------------- */
/* Search: only the categories that have a match, opened                      */
/* -------------------------------------------------------------------------- */

function SearchResults({
  categories,
  search,
  status,
  renderMenu,
  onAddCriterion,
}: {
  categories: Category[];
  search: string;
  status?: CriteriaStatus;
  renderMenu: (category: Category) => React.ReactNode;
  onAddCriterion: (categoryId: string) => void;
}) {
  const { version } = useDashboard();
  const query = useAdminQuery(
    () => getCriteria({ search, status, limit: 200 }),
    `search-${search}-${status ?? "all"}-${version}`,
  );

  if (query.error && !query.data) {
    return <ModuleError error={query.error} onRetry={query.reload} />;
  }
  if (!query.data) return <ListSkeleton />;

  const byCategory = new Map<string, CriterionListItem[]>();
  for (const item of query.data.items) {
    byCategory.set(item.category.id, [
      ...(byCategory.get(item.category.id) ?? []),
      item,
    ]);
  }
  const matching = categories.filter((category) => byCategory.has(category.id));
  if (matching.length === 0) {
    return (
      <Text color="secondary" className="py-8 text-center">
        {FILTER_EMPTY}
      </Text>
    );
  }

  return (
    <ul className="flex flex-col gap-1.5">
      {matching.map((category) => (
        <CategoryRow
          key={category.id}
          category={category}
          isExpanded
          onToggle={() => undefined}
          menu={renderMenu(category)}
          onAddCriterion={() => onAddCriterion(category.id)}
        >
          <CriteriaRows items={byCategory.get(category.id) ?? []} />
        </CategoryRow>
      ))}
    </ul>
  );
}

/* -------------------------------------------------------------------------- */
/* Outstanding issues chosen in Module A                                      */
/* -------------------------------------------------------------------------- */

function IssueResults({
  filter,
  search,
}: {
  filter: Extract<DashboardFilter, { kind: "issue" }>;
  search: string;
}) {
  const { version, openCriterion } = useDashboard();
  const query = useAdminQuery(
    () => getIssues({ type: filter.issue, limit: 100 }),
    `issues-${filter.issue}-${version}`,
  );

  if (query.error && !query.data) {
    return <ModuleError error={query.error} onRetry={query.reload} />;
  }
  if (!query.data) return <ListSkeleton />;

  const needle = search.toLowerCase();
  const items = query.data.items.filter(
    (issue) =>
      !needle ||
      issue.title.toLowerCase().includes(needle) ||
      issue.categoryName.toLowerCase().includes(needle) ||
      (issue.description ?? "").toLowerCase().includes(needle),
  );
  if (items.length === 0) {
    return (
      <Text color="secondary" className="py-8 text-center">
        {query.data.items.length === 0
          ? "Không có vấn đề cần xử lý"
          : FILTER_EMPTY}
      </Text>
    );
  }

  const groups = new Map<string, IssueItem[]>();
  for (const issue of items) {
    groups.set(issue.categoryName, [
      ...(groups.get(issue.categoryName) ?? []),
      issue,
    ]);
  }

  return (
    <div className="flex flex-col gap-3">
      {[...groups].map(([categoryName, issues]) => (
        <section key={categoryName} className="flex flex-col gap-1">
          <Text as="h3" size="body-sm" weight="bold" color="secondary">
            {categoryName}
          </Text>
          <ul className="flex flex-col rounded-[7px] border-[1.5px] border-border-strong bg-surface-card p-2">
            {issues.map((issue) => {
              const { icon: StatusIcon, className } =
                STATUS_ICONS[issue.status];
              return (
                <li key={issue.id}>
                  <button
                    type="button"
                    onClick={() => openCriterion(issue.id)}
                    className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-sharp px-2 py-2 text-left hover:bg-surface-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-border-focus"
                  >
                    <StatusIcon
                      aria-hidden="true"
                      size={16}
                      className={cn("shrink-0", className)}
                    />
                    <span className="min-w-0 flex-1 text-body-sm break-words">
                      {issue.title}
                    </span>
                    <span className="flex flex-wrap justify-end gap-1">
                      {issue.issueTypes.map((type) => (
                        <Badge
                          key={type}
                          size="sm"
                          variant={ISSUE_BADGE_VARIANT[type]}
                        >
                          {ISSUE_LABELS[type]}
                        </Badge>
                      ))}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Category menu and delete                                                   */
/* -------------------------------------------------------------------------- */

function CategoryMenu({
  category,
  categories,
  onDialog,
}: {
  category: Category;
  categories: Category[];
  onDialog: (dialog: Dialog) => void;
}) {
  const { refresh } = useDashboard();
  const [error, setError] = useState<string>();
  const index = categories.findIndex((item) => item.id === category.id);

  async function move(offset: -1 | 1) {
    const order = categories.map((item) => item.id);
    const target = index + offset;
    if (target < 0 || target >= order.length) return;
    [order[index], order[target]] = [order[target], order[index]];
    setError(undefined);
    try {
      await reorderCategories(
        order.map((id, sortOrder) => ({ id, sortOrder })),
      );
      refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Có lỗi xảy ra.");
    }
  }

  return (
    <>
      <DropdownMenu>
        <MenuTrigger>
          <IconButton
            icon={MoreHorizontal}
            variant="ghost"
            size="compact"
            aria-label={`Thao tác với danh mục ${category.name}`}
          />
        </MenuTrigger>
        <MenuContent align="end">
          <MenuItem
            icon={Pencil}
            onSelect={() => onDialog({ kind: "category", category })}
          >
            Edit Category
          </MenuItem>
          <MenuItem
            icon={Plus}
            onSelect={() =>
              onDialog({ kind: "criterion", categoryId: category.id })
            }
          >
            Add Criteria
          </MenuItem>
          <MenuItem
            icon={ArrowUp}
            disabled={index <= 0}
            onSelect={() => void move(-1)}
          >
            Move up
          </MenuItem>
          <MenuItem
            icon={ArrowDown}
            disabled={index === categories.length - 1}
            onSelect={() => void move(1)}
          >
            Move down
          </MenuItem>
          <MenuItem
            icon={Trash2}
            onSelect={() => onDialog({ kind: "delete", category })}
          >
            Delete Category
          </MenuItem>
        </MenuContent>
      </DropdownMenu>
      {error && (
        <Alert variant="danger" className="w-full">
          {error}
        </Alert>
      )}
    </>
  );
}

function DeleteCategoryDialog({
  category,
  onClose,
}: {
  category: Category;
  onClose: () => void;
}) {
  const { refresh } = useDashboard();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string>();
  const count = category.stats.total;
  // The backend refuses to delete a category that still has criteria.
  const isBlocked = count > 0;

  async function handleConfirm() {
    setIsDeleting(true);
    setError(undefined);
    try {
      await deleteCategory(category.id);
      refresh();
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Có lỗi xảy ra.");
      setIsDeleting(false);
    }
  }

  return (
    <AlertDialog
      open
      variant="destructive"
      title="Xóa danh mục này?"
      description={
        isBlocked
          ? `Danh mục “${category.name}” còn ${count} tiêu chí. Hãy chuyển hoặc xóa các tiêu chí này trước khi xóa danh mục.`
          : `Danh mục “${category.name}” sẽ bị xóa.`
      }
      confirmLabel="Xóa danh mục"
      cancelLabel={isBlocked ? "Đóng" : "Huỷ"}
      isLoading={isDeleting}
      isConfirmDisabled={isBlocked}
      onConfirm={handleConfirm}
      onCancel={onClose}
    >
      {error && <Alert variant="danger">{error}</Alert>}
    </AlertDialog>
  );
}
