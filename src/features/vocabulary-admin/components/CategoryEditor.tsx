"use client";

import { useState } from "react";
import { ChevronsDownUp, ChevronsUpDown, Plus } from "lucide-react";
import { AlertDialog, Badge, Button, EmptyState, Text } from "@/design-system";
import {
  duplicateOf,
  moveItem,
  newItem,
  stateOf,
  type CategoryConfig,
} from "../categories";
import type { CategoryItem } from "../types";
import { ItemCard } from "./ItemCard";
import { StateBadge } from "./StateBadge";

export interface CategoryEditorProps {
  category: CategoryConfig;
  items: readonly CategoryItem[];
  onChange: (items: CategoryItem[]) => void;
}

/**
 * The list of one category: add, edit, duplicate, delete, reorder, and open or
 * close the cards. Any number of items is fine, from none up.
 */
export function CategoryEditor({
  category,
  items,
  onChange,
}: CategoryEditorProps) {
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());
  const [pendingDelete, setPendingDelete] = useState<CategoryItem>();
  const state = stateOf(category, items);
  const Icon = category.icon;
  const allOpen = items.length > 0 && items.every((item) => open.has(item.id));

  const toggle = (id: string) =>
    setOpen((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  function add() {
    const item = newItem(category);
    onChange([...items, item]);
    // A new item opens, ready to be filled in.
    setOpen((previous) => new Set(previous).add(item.id));
  }

  function duplicate(index: number) {
    const copy = duplicateOf(items[index]);
    const next = [...items];
    next.splice(index + 1, 0, copy);
    onChange(next);
    setOpen((previous) => new Set(previous).add(copy.id));
  }

  return (
    <section
      aria-labelledby={`category-${category.key}`}
      className="flex flex-col gap-4"
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            aria-hidden="true"
            className="flex size-11 shrink-0 items-center justify-center rounded-standard border-2 border-border-strong bg-accent-lime text-ink"
          >
            <Icon size={22} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Text
                as="h2"
                id={`category-${category.key}`}
                size="heading-md"
                weight="bold"
                className="font-display"
              >
                {category.label}
              </Text>
              <Badge size="sm" aria-label={`${items.length} mục`}>
                {items.length}
              </Badge>
              <StateBadge state={state} />
            </div>
            <Text size="body-sm" color="secondary">
              {category.purpose}
            </Text>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {items.length > 1 && (
            <Button
              size="compact"
              variant="outline"
              leftIcon={allOpen ? ChevronsDownUp : ChevronsUpDown}
              onClick={() =>
                setOpen(allOpen ? new Set() : new Set(items.map((i) => i.id)))
              }
            >
              {allOpen ? "Thu gọn tất cả" : "Mở rộng tất cả"}
            </Button>
          )}
          <Button size="compact" variant="accent" leftIcon={Plus} onClick={add}>
            Thêm {category.itemName}
          </Button>
        </div>
      </header>

      {items.length === 0 ? (
        <EmptyState
          icon={Icon}
          title={`Chưa có ${category.itemName} nào`}
          description={`${category.emptyHint} Thêm bao nhiêu mục tùy ý, không bắt buộc số lượng tối thiểu.`}
          action={
            <Button variant="accent" leftIcon={Plus} onClick={add}>
              Thêm {category.itemName}
            </Button>
          }
        />
      ) : (
        <ol
          aria-label={`${category.label}: ${items.length} mục`}
          className="flex flex-col gap-3"
        >
          {items.map((item, index) => (
            <ItemCard
              key={item.id}
              category={category}
              item={item}
              index={index}
              total={items.length}
              isExpanded={open.has(item.id)}
              onToggle={() => toggle(item.id)}
              onChange={(changed) =>
                onChange(items.map((i) => (i.id === item.id ? changed : i)))
              }
              onMove={(by) => onChange(moveItem(items, index, by))}
              onDuplicate={() => duplicate(index)}
              onDelete={() => setPendingDelete(item)}
            />
          ))}
        </ol>
      )}

      <AlertDialog
        open={pendingDelete !== undefined}
        variant="destructive"
        title={`Xoá ${category.itemName} này?`}
        description={`“${
          (pendingDelete && category.titleOf(pendingDelete)?.trim()) ||
          `${category.itemName} chưa đặt tên`
        }” sẽ bị xoá khỏi danh sách. Nó chỉ mất hẳn sau khi bạn lưu từ.`}
        confirmLabel="Xoá"
        cancelLabel="Hủy"
        onConfirm={() => {
          if (pendingDelete) {
            onChange(items.filter((i) => i.id !== pendingDelete.id));
          }
          setPendingDelete(undefined);
        }}
        onCancel={() => setPendingDelete(undefined)}
      />
    </section>
  );
}
