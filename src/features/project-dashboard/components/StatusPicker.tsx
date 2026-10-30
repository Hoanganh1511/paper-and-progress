"use client";

import { useRef, type KeyboardEvent } from "react";
import { cn } from "@/design-system";
import { STATUS_ICONS, STATUS_LABELS, STATUS_ORDER } from "../display";
import type { CriteriaStatus } from "../types";

/**
 * Each status has its own colour and icon, so it can be told apart at a glance:
 * green check (done), blue timer (in progress), grey dashed circle (not
 * started), red cross (blocked). The chosen one is filled and pressed in.
 */
const STYLES: Record<CriteriaStatus, { selected: string; idle: string }> = {
  COMPLETED: {
    selected: "border-border-strong bg-success-bg text-success-text",
    idle: "hover:bg-success-bg/60",
  },
  IN_PROGRESS: {
    selected: "border-border-strong bg-info-bg text-info-text",
    idle: "hover:bg-info-bg/60",
  },
  NOT_STARTED: {
    selected: "border-border-strong bg-surface-sunken text-text-primary",
    idle: "hover:bg-surface-sunken",
  },
  BLOCKED: {
    selected: "border-border-strong bg-danger-bg text-danger-text",
    idle: "hover:bg-danger-bg/60",
  },
};

export interface StatusPickerProps {
  value: CriteriaStatus;
  onValueChange: (status: CriteriaStatus) => void;
  /** Accessible name of the group. */
  label?: string;
}

/** The four statuses as a row of coloured choices; arrow keys move between them. */
export function StatusPicker({
  value,
  onValueChange,
  label = "Trạng thái",
}: StatusPickerProps) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  function handleKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    const step =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? 1
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? -1
          : 0;
    if (!step) return;
    event.preventDefault();
    const next =
      STATUS_ORDER[(index + step + STATUS_ORDER.length) % STATUS_ORDER.length];
    refs.current[next]?.focus();
    onValueChange(next);
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="grid grid-cols-2 gap-2"
    >
      {STATUS_ORDER.map((status, index) => {
        const isSelected = status === value;
        const { icon: Icon, className: iconClassName } = STATUS_ICONS[status];
        return (
          <button
            key={status}
            ref={(element) => {
              refs.current[status] = element;
            }}
            type="button"
            role="radio"
            aria-checked={isSelected}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onValueChange(status)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              "flex min-h-11 cursor-pointer items-center gap-2 rounded-standard border-2 px-3 text-left text-body-sm transition-[background-color,box-shadow,translate] motion-reduce:transition-none",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-border-focus",
              isSelected
                ? cn(
                    STYLES[status].selected,
                    "translate-x-0.5 translate-y-0.5 font-bold shadow-none",
                  )
                : cn(
                    "border-border-subtle bg-surface-card text-text-secondary shadow-raised",
                    STYLES[status].idle,
                  ),
            )}
          >
            <Icon
              aria-hidden="true"
              size={18}
              strokeWidth={isSelected ? 3 : 2.25}
              className={cn("shrink-0", iconClassName)}
            />
            {STATUS_LABELS[status]}
          </button>
        );
      })}
    </div>
  );
}
