"use client";

import { useMemo, useState, type ComponentProps, type DragEvent } from "react";
import {
  BookmarkX,
  LayoutGrid,
  List,
  SearchX,
  SlidersHorizontal,
} from "lucide-react";
import {
  Button,
  Checkbox,
  DeleteConfirmDialog,
  Drawer,
  EmptyState,
  FilterPanel,
  LayoutToggle,
  LinkButton,
  Pagination,
  SearchInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  Table,
  TableBody,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow,
  cn,
  countActiveFilters,
  type FilterGroup,
  type FilterValue,
  type SortDirection as TableSortDirection,
} from "@/design-system";
import {
  ALL_FOLDERS,
  FILTER_IDS,
  countByFolder,
  filterBookmarks,
  flattenFolders,
  sortBookmarks,
  type BookmarkSort,
  type BookmarkSortKey,
} from "../../filterBookmarks";
import {
  CONTENT_TYPE_LABELS,
  DOMAIN_LABELS,
  LEVEL_LABELS,
  SAVED_RANGE_LABELS,
  STATUS_LABELS,
} from "../../labels";
import type { Bookmark, BookmarkFolder, BookmarkLibrary } from "../../types";
import { BookmarkCard } from "../BookmarkCard";
import { BookmarkRow } from "../BookmarkRow";
import { BulkActionBar } from "../BulkActionBar";
import { BOOKMARK_DRAG_TYPE, FolderTree } from "../FolderTree";

const PAGE_SIZE = 12;

type Layout = "grid" | "list";

const LAYOUT_OPTIONS = [
  { value: "grid", label: "Dạng lưới", icon: LayoutGrid },
  { value: "list", label: "Dạng danh sách", icon: List },
];

const SORT_PRESETS: { value: string; label: string; sort: BookmarkSort }[] = [
  {
    value: "savedAt-desc",
    label: "Mới lưu nhất",
    sort: { key: "savedAt", direction: "desc" },
  },
  {
    value: "savedAt-asc",
    label: "Cũ nhất",
    sort: { key: "savedAt", direction: "asc" },
  },
  {
    value: "title-asc",
    label: "Tên A-Z",
    sort: { key: "title", direction: "asc" },
  },
  {
    value: "title-desc",
    label: "Tên Z-A",
    sort: { key: "title", direction: "desc" },
  },
  {
    value: "progress-desc",
    label: "Tiến độ cao nhất",
    sort: { key: "progress", direction: "desc" },
  },
  {
    value: "progress-asc",
    label: "Tiến độ thấp nhất",
    sort: { key: "progress", direction: "asc" },
  },
  {
    value: "level-asc",
    label: "Level: cơ bản trước",
    sort: { key: "level", direction: "asc" },
  },
  {
    value: "level-desc",
    label: "Level: nâng cao trước",
    sort: { key: "level", direction: "desc" },
  },
];

const PAGINATION_LABELS = {
  navigation: "Phân trang",
  previous: "Trang trước",
  next: "Trang sau",
  page: "Trang {page}",
};

const FILTER_PANEL_LABELS = {
  panel: "Bộ lọc",
  clearAll: "Xoá tất cả filter",
  selectedCount: "{count} đã chọn",
};

function countOptions<T extends string>(values: T[]) {
  const counts = new Map<T, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return counts;
}

function buildFilterGroups(bookmarks: Bookmark[]): FilterGroup[] {
  const byDomain = countOptions(bookmarks.map((b) => b.domain));
  const byType = countOptions(bookmarks.map((b) => b.contentType));
  const byLevel = countOptions(bookmarks.map((b) => b.level));
  const byStatus = countOptions(bookmarks.map((b) => b.status));
  const byTag = countOptions(bookmarks.flatMap((b) => b.tags));

  return [
    {
      id: FILTER_IDS.domain,
      label: "Lĩnh vực",
      options: Object.entries(DOMAIN_LABELS).map(([value, label]) => ({
        value,
        label,
        count: byDomain.get(value as Bookmark["domain"]) ?? 0,
      })),
    },
    {
      id: FILTER_IDS.tag,
      label: "Tags",
      display: "chips",
      options: [...byTag.keys()]
        .sort((a, b) => a.localeCompare(b, "vi"))
        .map((tag) => ({ value: tag, label: tag })),
    },
    {
      id: FILTER_IDS.type,
      label: "Loại nội dung",
      options: Object.entries(CONTENT_TYPE_LABELS).map(([value, label]) => ({
        value,
        label,
        count: byType.get(value as Bookmark["contentType"]) ?? 0,
      })),
    },
    {
      id: FILTER_IDS.level,
      label: "Level",
      options: Object.entries(LEVEL_LABELS).map(([value, label]) => ({
        value,
        label,
        count: byLevel.get(value as Bookmark["level"]) ?? 0,
      })),
    },
    {
      id: FILTER_IDS.status,
      label: "Trạng thái học",
      options: Object.entries(STATUS_LABELS).map(([value, label]) => ({
        value,
        label,
        count: byStatus.get(value as Bookmark["status"]) ?? 0,
      })),
    },
    {
      id: FILTER_IDS.saved,
      label: "Thời gian lưu",
      selection: "single",
      options: Object.entries(SAVED_RANGE_LABELS).map(([value, label]) => ({
        value,
        label,
      })),
    },
  ];
}

export interface BookmarkManagerProps extends Omit<
  ComponentProps<"div">,
  "children"
> {
  library: BookmarkLibrary;
}

/**
 * The bookmarks page: folders and filters on the left (a drawer below `lg`),
 * and on the right a toolbar (search, grid/list switch, sort) over the
 * bookmarks as cards or table rows, with paging below. Ticking bookmarks
 * swaps the toolbar for the bulk action bar. Everything is kept in memory:
 * moves, deletions, tags and new folders last until the page is reloaded.
 */
export function BookmarkManager({
  library,
  className,
  ...props
}: BookmarkManagerProps) {
  const { now } = library;
  const [bookmarks, setBookmarks] = useState(library.bookmarks);
  const [folders, setFolders] = useState(library.folders);
  const [folderId, setFolderId] = useState(ALL_FOLDERS);
  const [filters, setFilters] = useState<FilterValue>({});
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<BookmarkSort>({
    key: "savedAt",
    direction: "desc",
  });
  const [layout, setLayout] = useState<Layout>("grid");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Bookmark[] | null>(null);

  const folderPaths = useMemo(
    () => new Map(flattenFolders(folders).map((f) => [f.folder.id, f.path])),
    [folders],
  );
  const counts = useMemo(
    () => countByFolder(bookmarks, folders),
    [bookmarks, folders],
  );
  const filterGroups = useMemo(() => buildFilterGroups(bookmarks), [bookmarks]);
  const allTags = useMemo(
    () =>
      [...new Set(bookmarks.flatMap((b) => b.tags))].sort((a, b) =>
        a.localeCompare(b, "vi"),
      ),
    [bookmarks],
  );

  const matches = useMemo(
    () =>
      sortBookmarks(
        filterBookmarks(bookmarks, folders, { search, folderId, filters }, now),
        sort,
      ),
    [bookmarks, folders, search, folderId, filters, now, sort],
  );
  const pageCount = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = matches.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  // Only bookmarks that still exist can stay selected.
  const selected = selectedIds.filter((id) =>
    bookmarks.some((bookmark) => bookmark.id === id),
  );
  const hasActiveFilters = countActiveFilters(filters) > 0 || search !== "";
  const selectedSortPreset = SORT_PRESETS.find(
    (preset) =>
      preset.sort.key === sort.key && preset.sort.direction === sort.direction,
  );

  function folderLabelOf(bookmark: Bookmark) {
    return bookmark.folderId
      ? (folderPaths.get(bookmark.folderId) ?? "Chưa phân loại")
      : "Chưa phân loại";
  }

  function resetPage<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  function clearAllFilters() {
    setFilters({});
    setSearch("");
    setPage(1);
  }

  function setSelected(bookmarkId: string, isSelected: boolean) {
    setSelectedIds((current) =>
      isSelected
        ? [...new Set([...current, bookmarkId])]
        : current.filter((id) => id !== bookmarkId),
    );
  }

  function moveBookmarks(ids: string[], targetFolderId: string | null) {
    setBookmarks((current) =>
      current.map((bookmark) =>
        ids.includes(bookmark.id)
          ? { ...bookmark, folderId: targetFolderId }
          : bookmark,
      ),
    );
  }

  function addTag(ids: string[], tag: string) {
    setBookmarks((current) =>
      current.map((bookmark) =>
        ids.includes(bookmark.id) && !bookmark.tags.includes(tag)
          ? { ...bookmark, tags: [...bookmark.tags, tag] }
          : bookmark,
      ),
    );
  }

  function createFolder(label: string, parentId: string | null) {
    const newFolder: BookmarkFolder = {
      id: `folder-${crypto.randomUUID()}`,
      label,
      parentId,
    };
    setFolders((current) => [...current, newFolder]);
    setFolderId(newFolder.id);
    setPage(1);
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    const ids = pendingDelete.map((bookmark) => bookmark.id);
    setBookmarks((current) => current.filter((b) => !ids.includes(b.id)));
    setSelectedIds((current) => current.filter((id) => !ids.includes(id)));
    setPendingDelete(null);
  }

  function handleDragStart(event: DragEvent, bookmarkId: string) {
    // Dragging a ticked bookmark takes the whole selection with it.
    const ids = selected.includes(bookmarkId) ? selected : [bookmarkId];
    event.dataTransfer.setData(BOOKMARK_DRAG_TYPE, JSON.stringify(ids));
    event.dataTransfer.effectAllowed = "move";
  }

  function sortBy(key: BookmarkSortKey) {
    setSort((current) => ({
      key,
      direction:
        current.key === key
          ? current.direction === "asc"
            ? "desc"
            : "asc"
          : key === "savedAt" || key === "progress"
            ? "desc"
            : "asc",
    }));
    setPage(1);
  }

  function sortDirectionOf(key: BookmarkSortKey): TableSortDirection {
    if (sort.key !== key) return "none";
    return sort.direction === "asc" ? "ascending" : "descending";
  }

  const allVisibleSelected =
    visible.length > 0 && visible.every((b) => selected.includes(b.id));
  const someVisibleSelected = visible.some((b) => selected.includes(b.id));

  function toggleVisible(isSelected: boolean) {
    const visibleIds = visible.map((b) => b.id);
    setSelectedIds((current) =>
      isSelected
        ? [...new Set([...current, ...visibleIds])]
        : current.filter((id) => !visibleIds.includes(id)),
    );
  }

  const rowProps = (bookmark: Bookmark) => ({
    bookmark,
    folders,
    folderLabel: folderLabelOf(bookmark),
    now,
    isSelected: selected.includes(bookmark.id),
    onSelectChange: setSelected,
    onMove: (id: string, target: string | null) => moveBookmarks([id], target),
    onDelete: (target: Bookmark) => setPendingDelete([target]),
    onBookmarkDragStart: handleDragStart,
  });

  const sidebar = (
    <div className="flex flex-col gap-6">
      <FolderTree
        folders={folders}
        selectedId={folderId}
        counts={counts}
        onSelect={(id) => {
          setFolderId(id);
          setPage(1);
          setIsDrawerOpen(false);
        }}
        onCreateFolder={createFolder}
        onDropBookmarks={(target, ids) => moveBookmarks(ids, target)}
      />
      <FilterPanel
        groups={filterGroups}
        value={filters}
        onValueChange={resetPage(setFilters)}
        labels={FILTER_PANEL_LABELS}
      />
    </div>
  );

  return (
    <div
      className={cn(
        "grid items-start gap-6 lg:grid-cols-[16rem_1fr]",
        className,
      )}
      {...props}
    >
      <aside
        aria-label="Thư mục và bộ lọc"
        className="hidden lg:sticky lg:top-[calc(var(--app-header-height,0px)+1rem)] lg:block lg:max-h-[calc(100vh-var(--app-header-height,0px)-2rem)] lg:overflow-y-auto lg:pr-2"
      >
        {sidebar}
      </aside>

      <Drawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Thư mục và bộ lọc"
        closeLabel="Đóng"
      >
        <div className="p-4">{sidebar}</div>
      </Drawer>

      <section aria-label="Bookmark" className="flex min-w-0 flex-col gap-4">
        {selected.length > 0 ? (
          <BulkActionBar
            selectedCount={selected.length}
            folders={folders}
            tags={allTags}
            onMove={(target) => moveBookmarks(selected, target)}
            onAddTag={(tag) => addTag(selected, tag)}
            onDelete={() =>
              setPendingDelete(
                bookmarks.filter((bookmark) => selected.includes(bookmark.id)),
              )
            }
            onCancel={() => setSelectedIds([])}
          />
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              leftIcon={SlidersHorizontal}
              className="lg:hidden"
              onClick={() => setIsDrawerOpen(true)}
            >
              Bộ lọc
            </Button>
            <form
              role="search"
              onSubmit={(event) => event.preventDefault()}
              className="min-w-48 flex-1"
            >
              <SearchInput
                aria-label="Tìm bookmark"
                placeholder="Tìm theo tên bài, mô tả, tags…"
                autoComplete="off"
                clearLabel="Xoá tìm kiếm"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                onClear={() => {
                  setSearch("");
                  setPage(1);
                }}
              />
            </form>
            <LayoutToggle
              value={layout}
              onValueChange={(value) => setLayout(value as Layout)}
              label="Kiểu hiển thị"
              options={LAYOUT_OPTIONS}
            />
            <Select
              value={selectedSortPreset?.value}
              onValueChange={(value) => {
                const preset = SORT_PRESETS.find((p) => p.value === value);
                if (preset) {
                  setSort(preset.sort);
                  setPage(1);
                }
              }}
              className="w-52"
            >
              <SelectTrigger aria-label="Sắp xếp" placeholder="Sắp xếp theo" />
              <SelectContent>
                {SORT_PRESETS.map((preset) => (
                  <SelectItem key={preset.value} value={preset.value}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <p
          role="status"
          className="m-0 font-body text-body-sm text-text-secondary"
        >
          {matches.length} / {bookmarks.length} bookmark
        </p>

        {bookmarks.length === 0 ? (
          <EmptyState
            icon={BookmarkX}
            title="Chưa có bookmark nào"
            description="Lưu bài học yêu thích để xem lại sau!"
            action={<LinkButton href="/learn">Khám phá bài học</LinkButton>}
          />
        ) : matches.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="Không tìm thấy bookmark phù hợp"
            description={
              hasActiveFilters
                ? "Thử bỏ bớt từ khoá hoặc bộ lọc."
                : "Thư mục này chưa có bookmark nào."
            }
            action={
              hasActiveFilters ? (
                <Button variant="outline" onClick={clearAllFilters}>
                  Xoá filter
                </Button>
              ) : folderId !== ALL_FOLDERS ? (
                <Button
                  variant="outline"
                  onClick={() => setFolderId(ALL_FOLDERS)}
                >
                  Xem tất cả
                </Button>
              ) : undefined
            }
          />
        ) : layout === "grid" ? (
          <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 md:grid-cols-3 xl:grid-cols-4">
            {visible.map((bookmark) => (
              <li key={bookmark.id} className="min-w-0">
                <BookmarkCard {...rowProps(bookmark)} />
              </li>
            ))}
          </ul>
        ) : (
          <Table hoverable containerClassName="overflow-x-auto">
            <TableCaption className="sr-only">Danh sách bookmark</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    aria-label="Chọn tất cả bookmark đang hiển thị"
                    checked={allVisibleSelected}
                    indeterminate={!allVisibleSelected && someVisibleSelected}
                    onChange={(event) => toggleVisible(event.target.checked)}
                  />
                </TableHead>
                <TableHead
                  sortable
                  sortDirection={sortDirectionOf("title")}
                  onSort={() => sortBy("title")}
                >
                  Bài học
                </TableHead>
                <TableHead>Thư mục</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead
                  sortable
                  sortDirection={sortDirectionOf("progress")}
                  onSort={() => sortBy("progress")}
                >
                  Tiến độ
                </TableHead>
                <TableHead
                  sortable
                  sortDirection={sortDirectionOf("level")}
                  onSort={() => sortBy("level")}
                >
                  Level
                </TableHead>
                <TableHead
                  sortable
                  sortDirection={sortDirectionOf("savedAt")}
                  onSort={() => sortBy("savedAt")}
                >
                  Đã lưu
                </TableHead>
                <TableHead>
                  <span className="sr-only">Thao tác</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((bookmark) => (
                <BookmarkRow key={bookmark.id} {...rowProps(bookmark)} />
              ))}
            </TableBody>
          </Table>
        )}

        {pageCount > 1 && (
          <Pagination
            page={currentPage}
            pageCount={pageCount}
            onPageChange={setPage}
            labels={PAGINATION_LABELS}
            className="self-center"
          />
        )}
      </section>

      <DeleteConfirmDialog
        open={pendingDelete !== null}
        count={pendingDelete?.length}
        itemName={pendingDelete?.[0]?.title}
        description="Bài học vẫn còn trong thư viện, chỉ bookmark bị xoá."
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
        labels={{
          titleOne: "Xoá bookmark này?",
          titleNamed: "Xoá bookmark “{name}”?",
          titleMany: "Xoá {count} bookmark?",
          confirm: "Xoá",
          cancel: "Huỷ",
        }}
      />
    </div>
  );
}
