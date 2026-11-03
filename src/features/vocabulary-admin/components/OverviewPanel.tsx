"use client";

import { Badge, Text } from "@/design-system";
import { CATEGORIES, PART_OF_SPEECH_OPTIONS, stateOf } from "../categories";
import type { WordForm } from "../form";
import type { VocabUnit } from "../types";
import type { SectionKey } from "./CategoryNav";
import { StateBadge } from "./StateBadge";

export interface OverviewPanelProps {
  form: WordForm;
  units: readonly VocabUnit[];
  isBasicsDone: boolean;
  active: SectionKey;
  onSelect: (key: SectionKey) => void;
}

/**
 * The word at a glance, and where each category stands: empty, in progress or
 * completed. No percentages: a category either has its items filled in or not.
 */
export function OverviewPanel({
  form,
  units,
  isBasicsDone,
  active,
  onSelect,
}: OverviewPanelProps) {
  const { basics } = form;
  const unit = units.find((item) => item.id === basics.unitId);
  const partNames = basics.partsOfSpeech.map(
    (part) =>
      PART_OF_SPEECH_OPTIONS.find((option) => option.value === part)?.label ??
      part,
  );
  const done = CATEGORIES.filter(
    (category) => stateOf(category, form.content[category.key]) === "COMPLETED",
  ).length;

  return (
    <aside
      aria-label="Tổng quan từ vựng"
      className="flex flex-col gap-4 rounded-standard border-2 border-border-strong bg-surface-card p-4 shadow-raised"
    >
      <div className="flex flex-col gap-2">
        <Text size="body-sm" weight="semibold" color="secondary">
          Tổng quan
        </Text>
        <Text
          as="p"
          lang="en"
          size="heading-md"
          weight="bold"
          className="font-display break-words"
        >
          {basics.word.trim() || "Từ mới"}
        </Text>
        {basics.pronunciation.trim() && (
          <Text size="body-sm" color="secondary">
            {basics.pronunciation}
          </Text>
        )}
        <div className="flex flex-wrap gap-1.5">
          {basics.level && (
            <Badge variant="blue" size="sm">
              {basics.level}
            </Badge>
          )}
          {partNames.map((name) => (
            <Badge key={name} size="sm">
              {name}
            </Badge>
          ))}
        </div>
        {unit && (
          <Text size="body-sm" color="secondary">
            Unit {unit.unitNumber} · {unit.topic}
          </Text>
        )}
        {basics.meaningVi.trim() && (
          <Text size="body-sm">{basics.meaningVi}</Text>
        )}
      </div>

      <div className="flex flex-col gap-2 border-t-2 border-border-subtle pt-3">
        <Text size="body-sm" weight="semibold" color="secondary">
          Trạng thái các phần
        </Text>
        <ul className="flex flex-col gap-1">
          <li>
            <Row
              label="Thông tin từ"
              isCurrent={active === "basic"}
              onClick={() => onSelect("basic")}
            >
              <StateBadge state={isBasicsDone ? "COMPLETED" : "IN_PROGRESS"} />
            </Row>
          </li>
          {CATEGORIES.map((category) => {
            const items = form.content[category.key];
            return (
              <li key={category.key}>
                <Row
                  label={category.label}
                  count={items.length}
                  isCurrent={active === category.key}
                  onClick={() => onSelect(category.key)}
                >
                  <StateBadge state={stateOf(category, items)} />
                </Row>
              </li>
            );
          })}
        </ul>
        <Text size="body-sm" color="muted">
          {done} trong {CATEGORIES.length} nhóm học đã hoàn thành.
        </Text>
      </div>
    </aside>
  );
}

function Row({
  label,
  count,
  isCurrent,
  onClick,
  children,
}: {
  label: string;
  count?: number;
  isCurrent: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-current={isCurrent ? "true" : undefined}
      onClick={onClick}
      className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-sharp px-2 text-left hover:bg-surface-sunken aria-[current=true]:font-bold focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-border-focus"
    >
      <span className="min-w-0 truncate text-body-sm">
        {label}
        {count !== undefined && (
          <span className="text-text-secondary"> ({count})</span>
        )}
      </span>
      {children}
    </button>
  );
}
