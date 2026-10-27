"use client";

import {
  useId,
  useState,
  type ComponentProps,
  type DragEvent,
  type FormEvent,
} from "react";
import {
  ChevronRight,
  Folder,
  FolderOpen,
  FolderPlus,
  Inbox,
  Library,
  type LucideIcon,
} from "lucide-react";
import {
  Badge,
  Button,
  IconButton,
  Input,
  cn,
  focusRingClasses,
} from "@/design-system";
import { ALL_FOLDERS, UNSORTED_FOLDER } from "../../filterBookmarks";
import type { BookmarkFolder } from "../../types";

/** Drag-and-drop type carrying the ids of the bookmarks being moved. */
export const BOOKMARK_DRAG_TYPE = "application/x-bookmark-ids";

/** The bookmark ids carried by a drag, or none when it is something else. */
export function readDraggedBookmarkIds(dataTransfer: DataTransfer): string[] {
  try {
    const parsed: unknown = JSON.parse(
      dataTransfer.getData(BOOKMARK_DRAG_TYPE),
    );
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

export interface FolderTreeProps extends Omit<
  ComponentProps<"nav">,
  "onSelect" | "children"
> {
  folders: BookmarkFolder[];
  /** `ALL_FOLDERS`, `UNSORTED_FOLDER` or a folder id. */
  selectedId: string;
  /** Bookmarks per folder id, plus the `all` and `unsorted` totals. */
  counts: Record<string, number>;
  onSelect: (folderId: string) => void;
  /** Called with the new folder's name; `parentId` is the selected folder, if any. */
  onCreateFolder: (label: string, parentId: string | null) => void;
  /** Called when bookmarks are dropped on a folder (`null` = unsorted). */
  onDropBookmarks: (folderId: string | null, bookmarkIds: string[]) => void;
}

interface RowProps {
  label: string;
  icon: LucideIcon;
  count: number;
  isSelected: boolean;
  depth?: number;
  onSelect: () => void;
  /** Where dropped bookmarks go; leave out when the row is not a drop target. */
  onDropBookmarks?: (bookmarkIds: string[]) => void;
  expander?: { isExpanded: boolean; label: string; onToggle: () => void };
}

function FolderRow({
  label,
  icon: Icon,
  count,
  isSelected,
  depth = 0,
  onSelect,
  onDropBookmarks,
  expander,
}: RowProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  function handleDragOver(event: DragEvent) {
    if (!onDropBookmarks) return;
    if (!event.dataTransfer.types.includes(BOOKMARK_DRAG_TYPE)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setIsDragOver(true);
  }

  function handleDrop(event: DragEvent) {
    setIsDragOver(false);
    if (!onDropBookmarks) return;
    event.preventDefault();
    const ids = readDraggedBookmarkIds(event.dataTransfer);
    if (ids.length) onDropBookmarks(ids);
  }

  return (
    <div
      className="flex items-center"
      style={{ paddingInlineStart: `${depth * 16}px` }}
      onDragOver={handleDragOver}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      {expander ? (
        <IconButton
          icon={ChevronRight}
          aria-label={expander.label}
          aria-expanded={expander.isExpanded}
          variant="ghost"
          size="compact"
          className={cn(
            "shrink-0 [&>svg]:transition-transform [&>svg]:duration-[var(--duration-fast)] motion-reduce:[&>svg]:transition-none",
            expander.isExpanded && "[&>svg]:rotate-90",
          )}
          onClick={expander.onToggle}
        />
      ) : (
        <span aria-hidden="true" className="w-8 shrink-0" />
      )}
      <button
        type="button"
        aria-current={isSelected ? "true" : undefined}
        onClick={onSelect}
        className={cn(
          "flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-standard border border-transparent px-2 text-left font-body text-body-md text-text-primary transition-colors duration-[var(--duration-fast)] hover:bg-surface-sunken motion-reduce:transition-none",
          "aria-[current=true]:border-border-strong aria-[current=true]:bg-accent-lime aria-[current=true]:font-semibold aria-[current=true]:text-ink",
          isDragOver && "border-dashed border-border-strong bg-surface-sunken",
          focusRingClasses,
        )}
      >
        <Icon aria-hidden="true" size={16} className="shrink-0" />
        <span className="min-w-0 flex-1 truncate">{label}</span>{" "}
        <Badge size="sm" variant="default" className="shrink-0">
          <span className="sr-only">Số bookmark: </span>
          {count}
        </Badge>
      </button>
    </div>
  );
}

/**
 * The user's folders as a nested list. "Tất cả" and "Chưa phân loại" sit on
 * top; folders below can be opened and closed, receive bookmarks dragged onto
 * them, and new ones are made with the button at the bottom (inside the
 * selected folder, or at the top level when "Tất cả" is selected). Selecting a
 * folder also shows what is inside its sub-folders. Moving bookmarks without
 * dragging is done from each bookmark's "Chuyển folder" menu.
 */
export function FolderTree({
  folders,
  selectedId,
  counts,
  onSelect,
  onCreateFolder,
  onDropBookmarks,
  className,
  ...props
}: FolderTreeProps) {
  const inputId = useId();
  const [collapsedIds, setCollapsedIds] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [draft, setDraft] = useState("");

  const selectedFolder = folders.find((folder) => folder.id === selectedId);

  function toggleExpanded(folderId: string) {
    setCollapsedIds((current) =>
      current.includes(folderId)
        ? current.filter((id) => id !== folderId)
        : [...current, folderId],
    );
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const label = draft.trim();
    if (!label) return;
    onCreateFolder(label, selectedFolder?.id ?? null);
    setDraft("");
    setIsCreating(false);
  }

  function renderChildren(parentId: string | null, depth: number) {
    return folders
      .filter((folder) => folder.parentId === parentId)
      .map((folder) => {
        const hasChildren = folders.some((f) => f.parentId === folder.id);
        const isExpanded = !collapsedIds.includes(folder.id);
        const isSelected = folder.id === selectedId;
        return (
          <li key={folder.id}>
            <FolderRow
              label={folder.label}
              icon={
                isSelected || (hasChildren && isExpanded) ? FolderOpen : Folder
              }
              count={counts[folder.id] ?? 0}
              isSelected={isSelected}
              depth={depth}
              onSelect={() => onSelect(folder.id)}
              onDropBookmarks={(ids) => onDropBookmarks(folder.id, ids)}
              expander={
                hasChildren
                  ? {
                      isExpanded,
                      label: `${isExpanded ? "Thu gọn" : "Mở rộng"} ${folder.label}`,
                      onToggle: () => toggleExpanded(folder.id),
                    }
                  : undefined
              }
            />
            {hasChildren && isExpanded && (
              <ul className="m-0 list-none p-0">
                {renderChildren(folder.id, depth + 1)}
              </ul>
            )}
          </li>
        );
      });
  }

  return (
    <nav
      aria-label="Thư mục"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    >
      <ul className="m-0 flex list-none flex-col p-0">
        <li>
          <FolderRow
            label="Tất cả"
            icon={Library}
            count={counts[ALL_FOLDERS] ?? 0}
            isSelected={selectedId === ALL_FOLDERS}
            onSelect={() => onSelect(ALL_FOLDERS)}
          />
        </li>
        <li>
          <FolderRow
            label="Chưa phân loại"
            icon={Inbox}
            count={counts[UNSORTED_FOLDER] ?? 0}
            isSelected={selectedId === UNSORTED_FOLDER}
            onSelect={() => onSelect(UNSORTED_FOLDER)}
            onDropBookmarks={(ids) => onDropBookmarks(null, ids)}
          />
        </li>
        {renderChildren(null, 0)}
      </ul>

      {isCreating ? (
        <form onSubmit={submit} className="flex flex-col gap-2">
          <label
            htmlFor={inputId}
            className="font-body text-body-sm text-text-secondary"
          >
            {selectedFolder
              ? `Tên thư mục con trong “${selectedFolder.label}”`
              : "Tên thư mục mới"}
          </label>
          <Input
            id={inputId}
            value={draft}
            autoFocus
            maxLength={40}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setIsCreating(false);
                setDraft("");
              }
            }}
          />
          <div className="flex gap-2">
            <Button type="submit" size="compact" disabled={!draft.trim()}>
              Tạo
            </Button>
            <Button
              type="button"
              size="compact"
              variant="ghost"
              onClick={() => {
                setIsCreating(false);
                setDraft("");
              }}
            >
              Huỷ
            </Button>
          </div>
        </form>
      ) : (
        <Button
          variant="outline"
          size="compact"
          leftIcon={FolderPlus}
          className="self-start"
          onClick={() => setIsCreating(true)}
        >
          Tạo thư mục
        </Button>
      )}
    </nav>
  );
}
