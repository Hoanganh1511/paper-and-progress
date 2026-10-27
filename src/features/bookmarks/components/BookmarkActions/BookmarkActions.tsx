"use client";

import type { ComponentProps } from "react";
import { ExternalLink, FolderInput, Inbox, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  IconButton,
  LinkButton,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuTrigger,
  cn,
} from "@/design-system";
import { flattenFolders } from "../../filterBookmarks";
import type { Bookmark, BookmarkFolder } from "../../types";

export interface BookmarkActionsProps extends Omit<
  ComponentProps<"div">,
  "children"
> {
  bookmark: Bookmark;
  folders: BookmarkFolder[];
  /** `null` moves the bookmark out of its folder. */
  onMove: (bookmarkId: string, folderId: string | null) => void;
  onDelete: (bookmark: Bookmark) => void;
}

/**
 * The three things done to one bookmark: open the lesson, move it to another
 * folder (a menu, which is also the keyboard way to what dragging does) and
 * remove it. Deleting only asks the parent to; confirming is up to it.
 */
export function BookmarkActions({
  bookmark,
  folders,
  onMove,
  onDelete,
  className,
  ...props
}: BookmarkActionsProps) {
  return (
    <div className={cn("flex items-center gap-1", className)} {...props}>
      <LinkButton
        href={bookmark.href}
        variant="secondary"
        leftIcon={ExternalLink}
        aria-label={`Mở bài: ${bookmark.title}`}
        className="aspect-square px-0"
      />
      <DropdownMenu>
        <MenuTrigger>
          <IconButton
            icon={FolderInput}
            variant="secondary"
            aria-label={`Chuyển folder: ${bookmark.title}`}
          />
        </MenuTrigger>
        <MenuContent align="end">
          <MenuLabel>Chuyển tới thư mục</MenuLabel>
          <MenuItem
            icon={Inbox}
            aria-disabled={bookmark.folderId === null || undefined}
            onSelect={() => onMove(bookmark.id, null)}
          >
            Chưa phân loại
          </MenuItem>
          {flattenFolders(folders).map(({ folder, path }) => (
            <MenuItem
              key={folder.id}
              aria-disabled={folder.id === bookmark.folderId || undefined}
              onSelect={() => onMove(bookmark.id, folder.id)}
            >
              {path}
            </MenuItem>
          ))}
        </MenuContent>
      </DropdownMenu>
      <IconButton
        icon={Trash2}
        variant="secondary"
        aria-label={`Xoá bookmark: ${bookmark.title}`}
        onClick={() => onDelete(bookmark)}
      />
    </div>
  );
}
