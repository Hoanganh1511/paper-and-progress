"use client";

import type { ComponentProps } from "react";
import { FolderInput, Inbox, Tag, Trash2, X } from "lucide-react";
import {
  Button,
  DropdownMenu,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuTrigger,
  cn,
} from "@/design-system";
import { flattenFolders } from "../../filterBookmarks";
import type { BookmarkFolder } from "../../types";

export interface BulkActionBarProps extends Omit<
  ComponentProps<"div">,
  "children" | "role"
> {
  selectedCount: number;
  folders: BookmarkFolder[];
  /** Tags that can be added to every selected bookmark. */
  tags: string[];
  onMove: (folderId: string | null) => void;
  onAddTag: (tag: string) => void;
  onDelete: () => void;
  onCancel: () => void;
}

/**
 * Replaces the toolbar while bookmarks are ticked: how many are chosen and
 * what to do with all of them — move to a folder, add a tag, delete — or let
 * go of the selection. The count is a polite live region so a screen reader
 * hears it change as boxes are ticked.
 */
export function BulkActionBar({
  selectedCount,
  folders,
  tags,
  onMove,
  onAddTag,
  onDelete,
  onCancel,
  className,
  ...props
}: BulkActionBarProps) {
  return (
    <div
      role="region"
      aria-label="Thao tác hàng loạt"
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-standard border-2 border-border-strong bg-accent-lime p-2 text-ink",
        className,
      )}
      {...props}
    >
      <p
        role="status"
        className="m-0 px-2 font-display text-body-md font-semibold"
      >
        Đã chọn {selectedCount}
      </p>

      <DropdownMenu>
        <MenuTrigger>
          <Button variant="secondary" leftIcon={FolderInput}>
            Chuyển folder
          </Button>
        </MenuTrigger>
        <MenuContent>
          <MenuLabel>Chuyển tới thư mục</MenuLabel>
          <MenuItem icon={Inbox} onSelect={() => onMove(null)}>
            Chưa phân loại
          </MenuItem>
          {flattenFolders(folders).map(({ folder, path }) => (
            <MenuItem key={folder.id} onSelect={() => onMove(folder.id)}>
              {path}
            </MenuItem>
          ))}
        </MenuContent>
      </DropdownMenu>

      {tags.length > 0 && (
        <DropdownMenu>
          <MenuTrigger>
            <Button variant="secondary" leftIcon={Tag}>
              Đánh tag
            </Button>
          </MenuTrigger>
          <MenuContent>
            <MenuLabel>Thêm tag vào các mục đã chọn</MenuLabel>
            {tags.map((tag) => (
              <MenuItem key={tag} onSelect={() => onAddTag(tag)}>
                {tag}
              </MenuItem>
            ))}
          </MenuContent>
        </DropdownMenu>
      )}

      <Button variant="secondary" leftIcon={Trash2} onClick={onDelete}>
        Xoá
      </Button>
      <Button
        variant="ghost"
        leftIcon={X}
        className="ml-auto"
        onClick={onCancel}
      >
        Huỷ
      </Button>
    </div>
  );
}
