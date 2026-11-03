"use client";

import { useState } from "react";
import { ChevronDown, FileText } from "lucide-react";
import { Badge, Text, cn } from "@/design-system";
import { CATEGORIES, STATE_LABELS, stateOf } from "../categories";
import type { CategoryState, ContentCategory } from "../types";
import type { WordForm } from "../form";

export type SectionKey = "basic" | ContentCategory;

export interface CategoryNavProps {
  form: WordForm;
  active: SectionKey;
  /** True when the word's required fields are all filled. */
  isBasicsDone: boolean;
  onSelect: (key: SectionKey) => void;
}

interface Entry {
  key: SectionKey;
  label: string;
  icon: typeof FileText;
  count?: number;
  state?: CategoryState;
}

/**
 * The sections of the editor. A vertical list beside the form from `lg`; on a
 * phone it folds into one button showing the open section, so the form gets the
 * whole width.
 */
export function CategoryNav({
  form,
  active,
  isBasicsDone,
  onSelect,
}: CategoryNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const entries: Entry[] = [
    { key: "basic", label: "Thông tin từ", icon: FileText },
    ...CATEGORIES.map((category) => ({
      key: category.key as SectionKey,
      label: category.label,
      icon: category.icon,
      count: form.content[category.key].length,
      state: stateOf(category, form.content[category.key]),
    })),
  ];
  const current = entries.find((entry) => entry.key === active) ?? entries[0];

  return (
    <nav aria-label="Các phần của từ" className="flex flex-col gap-2">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls="vocab-section-list"
        onClick={() => setIsOpen((open) => !open)}
        className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-standard border-2 border-border-strong bg-surface-card px-4 font-semibold shadow-raised lg:hidden"
      >
        <span>Phần: {current.label}</span>
        <ChevronDown
          aria-hidden="true"
          size={18}
          className={cn(isOpen && "rotate-180")}
        />
      </button>
      <ul
        id="vocab-section-list"
        className={cn("flex-col gap-1.5 lg:flex", isOpen ? "flex" : "hidden")}
      >
        {entries.map((entry) => {
          const Icon = entry.icon;
          const isCurrent = entry.key === active;
          return (
            <li key={entry.key}>
              <button
                type="button"
                aria-current={isCurrent ? "true" : undefined}
                onClick={() => {
                  onSelect(entry.key);
                  setIsOpen(false);
                }}
                className={cn(
                  "flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-standard border-2 px-3 py-2 text-left text-body-md",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-border-focus motion-reduce:transition-none",
                  isCurrent
                    ? "translate-x-0.5 translate-y-0.5 border-border-strong bg-accent-lime font-bold shadow-none"
                    : "border-transparent hover:border-border-strong hover:bg-surface-card",
                )}
              >
                <Icon aria-hidden="true" size={18} className="shrink-0" />
                <span className="min-w-0 flex-1 truncate">{entry.label}</span>
                {entry.count !== undefined ? (
                  <>
                    <Badge size="sm" aria-label={`${entry.count} mục`}>
                      {entry.count}
                    </Badge>
                    <span className="sr-only">
                      {STATE_LABELS[entry.state as CategoryState]}
                    </span>
                    <StateMark state={entry.state as CategoryState} />
                  </>
                ) : (
                  <>
                    <span className="sr-only">
                      {isBasicsDone ? "Đã đủ" : "Còn thiếu"}
                    </span>
                    <StateMark
                      state={isBasicsDone ? "COMPLETED" : "IN_PROGRESS"}
                    />
                  </>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      <Text size="body-sm" color="muted" className="hidden lg:block">
        Mỗi nhóm lưu riêng, chỉ cần điền nhóm nào có nội dung.
      </Text>
    </nav>
  );
}

/** A small mark of the state: empty circle, "…" in progress, a tick when completed. Screen readers get the words next to it. */
function StateMark({ state }: { state: CategoryState }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex size-5 shrink-0 items-center justify-center rounded-pill border-2 border-border-strong text-[10px] leading-none font-bold",
        state === "COMPLETED" && "bg-accent-lime",
        state === "IN_PROGRESS" && "bg-accent-yellow",
        state === "EMPTY" && "bg-surface-card",
      )}
    >
      {state === "COMPLETED" ? "✓" : state === "IN_PROGRESS" ? "…" : ""}
    </span>
  );
}
