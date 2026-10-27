"use client";

import { useId, useState, type ComponentProps } from "react";
import { Check, ChevronDown, FilterX } from "lucide-react";
import { cn } from "../../../utils/cn";
import { focusRingClasses } from "../../../primitives/FocusRing";
import { Button } from "../../../components/actions/Button/Button";
import { Checkbox } from "../../../components/forms/Checkbox";
import { RadioGroup, RadioItem } from "../../../components/forms/RadioGroup";

export interface FilterOption {
  value: string;
  label: string;
  /** How many results the option would give; shown beside the label. */
  count?: number;
}

export interface FilterGroup {
  id: string;
  label: string;
  options: FilterOption[];
  /** `multiple` (default) allows any number of options; `single` exactly one. */
  selection?: "multiple" | "single";
  /** `list` (default) is a column of checkboxes/radios; `chips` are wrapped toggle pills. */
  display?: "list" | "chips";
}

/** Selected option values per group id. */
export type FilterValue = Record<string, string[]>;

export interface FilterPanelLabels {
  /** Accessible name of the panel. */
  panel: string;
  clearAll: string;
  /** `{count}` is replaced with the number of selected options in the group. */
  selectedCount: string;
}

export const defaultFilterPanelLabels: FilterPanelLabels = {
  panel: "Filters",
  clearAll: "Clear all filters",
  selectedCount: "{count} selected",
};

export interface FilterPanelProps extends Omit<
  ComponentProps<"div">,
  "onChange" | "role"
> {
  groups: FilterGroup[];
  value: FilterValue;
  onValueChange: (value: FilterValue) => void;
  /** Group ids that start collapsed. */
  defaultCollapsedIds?: string[];
  /** Replace any of the texts (translations). */
  labels?: Partial<FilterPanelLabels>;
}

/** Number of options selected across all groups. */
export function countActiveFilters(value: FilterValue) {
  return Object.values(value).reduce((sum, values) => sum + values.length, 0);
}

function toggle(values: string[], option: string) {
  return values.includes(option)
    ? values.filter((current) => current !== option)
    : [...values, option];
}

function OptionText({ option }: { option: FilterOption }) {
  return (
    <span className="inline-flex items-baseline gap-2">
      {option.label}
      {option.count !== undefined && (
        <span className="font-body text-caption text-text-muted">
          {option.count}
        </span>
      )}
    </span>
  );
}

/**
 * A stack of collapsible filter groups (checkbox lists, radio lists or toggle
 * chips) with a button that clears every selection. It owns no state besides
 * which groups are open: the selection lives in the parent (`value`), so the
 * same panel can drive a bookmark list, a search page or anything else.
 */
export function FilterPanel({
  groups,
  value,
  onValueChange,
  defaultCollapsedIds = [],
  labels: labelOverrides,
  className,
  ref,
  ...props
}: FilterPanelProps) {
  const labels = { ...defaultFilterPanelLabels, ...labelOverrides };
  const baseId = useId();
  const [collapsedIds, setCollapsedIds] = useState(defaultCollapsedIds);
  const activeCount = countActiveFilters(value);

  function setGroup(groupId: string, values: string[]) {
    onValueChange({ ...value, [groupId]: values });
  }

  return (
    <div
      ref={ref}
      role="group"
      aria-label={labels.panel}
      className={cn("flex flex-col gap-2", className)}
      {...props}
    >
      <Button
        variant="outline"
        size="compact"
        leftIcon={FilterX}
        disabled={activeCount === 0}
        onClick={() => onValueChange({})}
        className="self-start"
      >
        {labels.clearAll}
      </Button>

      {groups.map((group) => {
        const selected = value[group.id] ?? [];
        const isOpen = !collapsedIds.includes(group.id);
        const headingId = `${baseId}-${group.id}-heading`;
        const panelId = `${baseId}-${group.id}-panel`;

        return (
          <section
            key={group.id}
            aria-labelledby={headingId}
            className="border-b border-border-subtle pb-2"
          >
            <h3 id={headingId} className="m-0">
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() =>
                  setCollapsedIds((current) => toggle(current, group.id))
                }
                className={cn(
                  "flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-sharp text-left font-display text-body-md font-semibold text-text-primary",
                  focusRingClasses,
                )}
              >
                <span>
                  {group.label}
                  {selected.length > 0 && (
                    <span className="ml-2 font-body text-caption font-medium text-text-secondary">
                      {labels.selectedCount.replace(
                        "{count}",
                        String(selected.length),
                      )}
                    </span>
                  )}
                </span>
                <ChevronDown
                  aria-hidden="true"
                  size={16}
                  className={cn(
                    "shrink-0 transition-transform duration-[var(--duration-fast)] motion-reduce:transition-none",
                    isOpen && "rotate-180",
                  )}
                />
              </button>
            </h3>

            <div id={panelId} hidden={!isOpen} className="pt-1">
              {group.selection === "single" ? (
                <RadioGroup
                  aria-labelledby={headingId}
                  value={selected[0]}
                  onValueChange={(option) => setGroup(group.id, [option])}
                  className="gap-0"
                >
                  {group.options.map((option) => (
                    <RadioItem
                      key={option.value}
                      value={option.value}
                      label={<OptionText option={option} />}
                    />
                  ))}
                </RadioGroup>
              ) : group.display === "chips" ? (
                <ul className="m-0 flex list-none flex-wrap gap-2 p-0 py-1">
                  {group.options.map((option) => {
                    const isSelected = selected.includes(option.value);
                    return (
                      <li key={option.value}>
                        <button
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() =>
                            setGroup(group.id, toggle(selected, option.value))
                          }
                          className={cn(
                            "relative inline-flex h-8 cursor-pointer items-center gap-1 rounded-pill border border-border-strong px-3 font-body text-body-sm font-medium transition-colors duration-[var(--duration-fast)] motion-reduce:transition-none",
                            "before:absolute before:top-1/2 before:left-1/2 before:size-full before:min-h-11 before:min-w-11 before:-translate-x-1/2 before:-translate-y-1/2",
                            isSelected
                              ? "bg-accent-lime text-ink"
                              : "bg-surface-card text-text-primary hover:bg-surface-sunken",
                            focusRingClasses,
                          )}
                        >
                          {isSelected && (
                            <Check
                              aria-hidden="true"
                              size={14}
                              strokeWidth={3}
                            />
                          )}
                          {option.label}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <ul className="m-0 flex list-none flex-col p-0">
                  {group.options.map((option) => (
                    <li key={option.value}>
                      <Checkbox
                        checked={selected.includes(option.value)}
                        onChange={() =>
                          setGroup(group.id, toggle(selected, option.value))
                        }
                        label={<OptionText option={option} />}
                        className="w-full"
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
