"use client";

import type { ComponentProps } from "react";
import { Badge, Text, cn } from "@/design-system";
import {
  SKILL_LABELS,
  STATUS_LABELS,
  formatDuration,
} from "../../learningLogs";
import type {
  LearningLog,
  LearningLogStatus,
  LearningSkillId,
} from "../../types";

const SKILL_BADGE = {
  programming: "blue",
  english: "pink",
  design: "yellow",
  reading: "lime",
  other: "default",
} as const satisfies Record<LearningSkillId, string>;

const STATUS_BADGE = {
  completed: "success",
  in_progress: "warning",
  not_completed: "default",
} as const satisfies Record<LearningLogStatus, string>;

const MAX_TAGS_SHOWN = 3;

export interface LearningLogListProps extends Omit<
  ComponentProps<"ul">,
  "children"
> {
  logs: LearningLog[];
  onOpen: (log: LearningLog) => void;
}

/**
 * One row per learning log. Each row is a button that opens the log's detail.
 * Status is written out ("Hoàn thành"), not only coloured.
 */
export function LearningLogList({
  logs,
  onOpen,
  className,
  ...props
}: LearningLogListProps) {
  return (
    <ul
      className={cn("m-0 flex list-none flex-col gap-3 p-0", className)}
      {...props}
    >
      {logs.map((log) => {
        const duration = formatDuration(log.durationMinutes);
        const hiddenTags = log.tags.length - MAX_TAGS_SHOWN;
        return (
          <li key={log.id}>
            <button
              type="button"
              onClick={() => onOpen(log)}
              className={cn(
                "flex min-h-11 w-full cursor-pointer flex-col gap-1.5 rounded-standard border border-border-default bg-surface-card p-3 text-left text-text-primary",
                "transition-colors duration-[var(--duration-fast)] hover:bg-surface-muted motion-reduce:transition-none",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-border-focus",
              )}
            >
              <span className="flex flex-wrap items-center gap-2">
                <Badge size="sm" variant={SKILL_BADGE[log.skillId]}>
                  {SKILL_LABELS[log.skillId]}
                </Badge>
                {duration && (
                  <span className="text-caption text-text-muted">
                    {duration}
                  </span>
                )}
                <Badge size="sm" variant={STATUS_BADGE[log.status]} dot>
                  {STATUS_LABELS[log.status]}
                </Badge>
              </span>
              <Text as="span" weight="semibold" className="break-words">
                {log.title}
              </Text>
              {log.goal && (
                <Text
                  as="span"
                  size="body-sm"
                  color="secondary"
                  className="line-clamp-2"
                >
                  {log.goal}
                </Text>
              )}
              {log.tags.length > 0 && (
                <span className="flex flex-wrap gap-x-2 text-caption text-text-muted">
                  {log.tags.slice(0, MAX_TAGS_SHOWN).map((tag) => (
                    <span key={tag}>{`#${tag}`}</span>
                  ))}
                  {hiddenTags > 0 && <span>{`+${hiddenTags}`}</span>}
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
