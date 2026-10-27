"use client";

import type { ComponentProps, DragEvent } from "react";
import { Clock, Folder, GraduationCap, Tag } from "lucide-react";
import {
  Badge,
  Card,
  Checkbox,
  ProgressBar,
  Text,
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

export interface BookmarkCardProps extends Omit<
  ComponentProps<"article">,
  "ref" | "title" | "onSelect" | "onDragStart"
> {
  bookmark: Bookmark;
  folders: BookmarkFolder[];
  /** Name of the folder the bookmark sits in; "Chưa phân loại" when none. */
  folderLabel: string;
  /** ISO date-time that the "saved ago" text is measured from. */
  now: string;
  isSelected: boolean;
  onSelectChange: (bookmarkId: string, isSelected: boolean) => void;
  onMove: (bookmarkId: string, folderId: string | null) => void;
  onDelete: (bookmark: Bookmark) => void;
  onBookmarkDragStart: (event: DragEvent, bookmarkId: string) => void;
}

/**
 * One bookmark as a card: thumbnail with a select box, title (the link to the
 * lesson), folder and tags, progress, level, duration and when it was saved.
 * The open / move / delete buttons appear on hover and on keyboard focus (and
 * are always shown on small screens, which have no hover). The card can be
 * dragged onto a folder in the tree.
 */
export function BookmarkCard({
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
}: BookmarkCardProps) {
  return (
    <Card
      as="article"
      padding="none"
      draggable
      onDragStart={(event) => onBookmarkDragStart(event, bookmark.id)}
      className={cn(
        "group relative h-full overflow-hidden",
        isSelected && "border-border-strong ring-2 ring-border-strong",
        className,
      )}
      {...props}
    >
      <div className="relative">
        <BookmarkThumbnail
          contentType={bookmark.contentType}
          domain={bookmark.domain}
          className="aspect-video w-full"
        />
        <Checkbox
          aria-label={`Chọn ${bookmark.title}`}
          checked={isSelected}
          onChange={(event) =>
            onSelectChange(bookmark.id, event.target.checked)
          }
          className="absolute top-1 left-1 min-h-11 min-w-11 justify-center rounded-standard bg-surface-card/90"
        />
        <BookmarkActions
          bookmark={bookmark}
          folders={folders}
          onMove={onMove}
          onDelete={onDelete}
          className="absolute top-1 right-1 opacity-100 transition-opacity duration-[var(--duration-fast)] motion-reduce:transition-none md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100"
        />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <Text
          as="h3"
          size="heading-sm"
          weight="semibold"
          className="line-clamp-2"
        >
          <a
            href={bookmark.href}
            className={cn("rounded-sharp", focusRingClasses)}
          >
            {bookmark.title}
          </a>
        </Text>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Text
            as="span"
            size="caption"
            color="secondary"
            className="inline-flex items-center gap-1"
          >
            <Folder aria-hidden="true" size={14} />
            <span className="sr-only">Thư mục: </span>
            {folderLabel}
          </Text>
          {bookmark.tags.length > 0 && (
            <ul className="m-0 flex list-none flex-wrap items-center gap-1 p-0">
              <li className="text-text-muted">
                <Tag aria-hidden="true" size={14} />
                <span className="sr-only">Thẻ:</span>
              </li>
              {bookmark.tags.map((tag) => (
                <li key={tag}>
                  <Badge size="sm">{tag}</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>

        <ProgressBar
          value={bookmark.progress}
          label={`Tiến độ: ${bookmark.title}`}
          showValue
        />

        <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
          <Badge
            size="sm"
            variant={LEVEL_VARIANTS[bookmark.level]}
            icon={GraduationCap}
          >
            {LEVEL_LABELS[bookmark.level]}
          </Badge>
          <Text
            as="span"
            size="caption"
            color="muted"
            className="inline-flex items-center gap-1"
          >
            <Clock aria-hidden="true" size={14} />
            {formatDuration(bookmark.durationMinutes)}
          </Text>
        </div>

        <Text as="p" size="caption" color="muted">
          {CONTENT_TYPE_LABELS[bookmark.contentType]} · Lưu:{" "}
          {formatSavedAgo(bookmark.savedAt, now)}
        </Text>
      </div>
    </Card>
  );
}
