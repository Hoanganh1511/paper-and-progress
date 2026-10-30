"use client";

import { useId, type ReactNode } from "react";
import { ArrowRight, ChevronRight, Plus } from "lucide-react";
import { Badge, Button, Text, cn } from "@/design-system";
import { useDashboard } from "../DashboardContext";
import {
  STATUS_BADGE_VARIANT,
  STATUS_ICONS,
  STATUS_LABELS,
  completedShare,
  progressColor,
} from "../display";
import type { Category, CriterionListItem } from "../types";
import { CategoryIcon } from "./CategoryIcon";

export interface CategoryRowProps {
  category: Category;
  isExpanded: boolean;
  onToggle: () => void;
  /** The "⋯" menu, shown beside the row. */
  menu: ReactNode;
  /** The criteria list, rendered inside the card while expanded. */
  children: ReactNode;
  /** Called by the "+ Thêm tiêu chí" button at the end of the expanded list. */
  onAddCriterion: () => void;
}

/** One category: a row with its icon, progress and count, and (expanded) its criteria below. */
export function CategoryRow({
  category,
  isExpanded,
  onToggle,
  menu,
  children,
  onAddCriterion,
}: CategoryRowProps) {
  const panelId = useId();
  const share = completedShare(category.stats);

  return (
    <li className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-expanded={isExpanded}
          aria-controls={panelId}
          onClick={onToggle}
          className="group flex min-h-12 min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-[7px] border-[1.5px] border-border-strong bg-surface-card p-3 text-left transition-colors hover:bg-surface-sunken motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-border-focus"
        >
          <ChevronRight
            aria-hidden="true"
            size={16}
            className="shrink-0 transition-transform group-aria-expanded:rotate-90 motion-reduce:transition-none"
          />
          <CategoryIcon name={category.icon} size={21} className="shrink-0" />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-[13px] font-bold">
              {category.name}
            </span>
            {category.description && (
              <span className="truncate text-[11px] text-text-secondary">
                {category.description}
              </span>
            )}
          </span>
          <span
            role="img"
            aria-label={`${category.stats.completed} trên ${category.stats.total} tiêu chí đã hoàn thành`}
            className="hidden h-2 w-24 shrink-0 overflow-hidden rounded-pill border border-border-strong bg-surface-sunken sm:block md:w-32"
          >
            <span
              className={cn("block h-full", progressColor(share))}
              style={{ width: `${share}%` }}
            />
          </span>
          <span className="shrink-0 text-[12px] font-bold">
            {category.stats.completed} / {category.stats.total}
          </span>
          <ArrowRight
            aria-hidden="true"
            size={16}
            className="shrink-0 text-text-secondary"
          />
        </button>
        {menu}
      </div>
      <div id={panelId} hidden={!isExpanded}>
        {isExpanded && (
          <div className="mb-2 flex flex-col gap-1 rounded-[7px] border-[1.5px] border-border-strong bg-surface-card p-2">
            {children}
            <Button
              variant="ghost"
              size="compact"
              leftIcon={Plus}
              onClick={onAddCriterion}
              className="self-start"
            >
              Thêm tiêu chí
            </Button>
          </div>
        )}
      </div>
    </li>
  );
}

export interface CriteriaRowsProps {
  items: CriterionListItem[];
}

/** The criteria of a category, each a row that opens the detail panel. */
export function CriteriaRows({ items }: CriteriaRowsProps) {
  const { openCriterion } = useDashboard();
  if (items.length === 0) {
    return (
      <Text size="body-sm" color="secondary" className="px-2 py-2">
        Chưa có tiêu chí nào.
      </Text>
    );
  }
  return (
    <ul className="flex flex-col">
      {items.map((item) => {
        const { icon: StatusIcon, className } = STATUS_ICONS[item.status];
        return (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => openCriterion(item.id)}
              className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-sharp px-2 py-2 text-left hover:bg-surface-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-border-focus"
            >
              <StatusIcon
                aria-hidden="true"
                size={16}
                className={cn("shrink-0", className)}
              />
              <span className="min-w-0 flex-1 text-body-sm break-words">
                {item.title}
              </span>
              <Badge size="sm" variant={STATUS_BADGE_VARIANT[item.status]}>
                {STATUS_LABELS[item.status]}
              </Badge>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
