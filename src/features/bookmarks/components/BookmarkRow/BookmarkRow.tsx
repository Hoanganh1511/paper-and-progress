"use client";

import type { ComponentProps, DragEvent } from "react";
import {
  Badge,
  Checkbox,
  ProgressBar,
  TableCell,
  TableRow,
  cn,
  focusRingClasses,
} from "@/design-system";
import {
  CONTENT_TYPE_LABELS,
  LEVEL_LABELS,
  formatDuration,
  formatSavedAgo,
} from "../../labels";
import type { Bookmark, BookmarkFolder } from "../../types";
import { BookmarkActions } from "../BookmarkActions";
import { BookmarkThumbnail } from "../BookmarkThumbnail";

const LEVEL_VARIANTS = {
  beginner: "lime",
  intermediate: "blue",
  advanced: "pink",
} as const;

export interface BookmarkRowProps extends Omit<
  ComponentProps<"tr">,
  "ref" | "title" | "onSelect" | "onDragStart"
> {
  bookmark: Bookmark;
  folders: BookmarkFolder[];
  folderLabel: string;
  now: string;
  isSelected: boolean;
  onSelectChange: (bookmarkId: string, isSelected: boolean) => void;
  onMove: (bookmarkId: string, folderId: string | null) => void;
  onDelete: (bookmark: Bookmark) => void;
  onBookmarkDragStart: (event: DragEvent, bookmarkId: string) => void;
}

/**
 * One bookmark as a compact table row: select box, thumbnail, title, folder,
 * tags, progress, level, saved time and the open / move / delete actions.
 * Meant to sit in the body of the bookmarks table, whose header names the
 * columns. Draggable onto a folder like the card.
 */
export function BookmarkRow({
  bookmark,
  folders,
  folderLabel,
  now,
  isSelected,
  onSelectChange,
  onMove,
  onDelete,
  onBookmarkDragStart,
  className,
  ...props
}: BookmarkRowProps) {
  return (
    <TableRow
      draggable
      onDragStart={(event) => onBookmarkDragStart(event, bookmark.id)}
      data-selected={isSelected || undefined}
      className={cn(
        "hover:bg-surface-sunken data-[selected]:bg-surface-sunken",
        className,
      )}
      {...props}
    >
      <TableCell className="w-12">
        <Checkbox
          aria-label={`Chọn ${bookmark.title}`}
          checked={isSelected}
          onChange={(event) =>
            onSelectChange(bookmark.id, event.target.checked)
          }
        />
      </TableCell>
      <TableCell className="min-w-64">
        <div className="flex items-center gap-3">
          <BookmarkThumbnail
            contentType={bookmark.contentType}
            domain={bookmark.domain}
            className="size-12 shrink-0 rounded-standard"
          />
          <div className="min-w-0">
            <a
              href={bookmark.href}
              className={cn(
                "rounded-sharp font-display text-body-md font-semibold text-text-primary",
                focusRingClasses,
              )}
            >
              {bookmark.title}
            </a>
            <p className="m-0 font-body text-caption text-text-muted">
              {CONTENT_TYPE_LABELS[bookmark.contentType]} ·{" "}
              {formatDuration(bookmark.durationMinutes)}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell className="whitespace-nowrap">{folderLabel}</TableCell>
      <TableCell>
        <ul className="m-0 flex list-none flex-wrap gap-1 p-0">
          {bookmark.tags.map((tag) => (
            <li key={tag}>
              <Badge size="sm">{tag}</Badge>
            </li>
          ))}
        </ul>
      </TableCell>
      <TableCell className="min-w-36">
        <ProgressBar
          value={bookmark.progress}
          label={`Tiến độ: ${bookmark.title}`}
          showValue
        />
      </TableCell>
      <TableCell>
        <Badge size="sm" variant={LEVEL_VARIANTS[bookmark.level]}>
          {LEVEL_LABELS[bookmark.level]}
        </Badge>
      </TableCell>
      <TableCell className="whitespace-nowrap">
        {formatSavedAgo(bookmark.savedAt, now)}
      </TableCell>
      <TableCell>
        <BookmarkActions
          bookmark={bookmark}
          folders={folders}
          onMove={onMove}
          onDelete={onDelete}
        />
      </TableCell>
    </TableRow>
  );
}
