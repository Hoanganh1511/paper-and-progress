"use client";

import {
  Archive,
  ArchiveRestore,
  Copy,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  Badge,
  DropdownMenu,
  IconButton,
  MenuContent,
  MenuItem,
  MenuTrigger,
  Text,
  cn,
} from "@/design-system";
import {
  SKILL_LABELS,
  STATUS_LABELS,
  formatDiaryDate,
  formatDuration,
  groupLogsByDate,
} from "../../logs";
import type { DiaryLog, DiarySkill } from "../../types";

export const SKILL_BADGE_VARIANT = {
  listening: "blue",
  speaking: "pink",
  reading: "lime",
  writing: "yellow",
  vocabulary: "default",
} as const satisfies Record<DiarySkill, string>;

export interface DiaryLogActions {
  onEdit: (log: DiaryLog) => void;
  onDuplicate: (log: DiaryLog) => void;
  onToggleArchive: (log: DiaryLog) => void;
  onDelete: (log: DiaryLog) => void;
}

export interface DiaryTimelineProps extends DiaryLogActions {
  logs: DiaryLog[];
  selectedId?: string;
  onSelect: (id: string) => void;
}

/** Logs grouped by day, newest first. Each row selects its log; "…" holds the actions. */
export function DiaryTimeline({
  logs,
  selectedId,
  onSelect,
  ...actions
}: DiaryTimelineProps) {
  return (
    <div className="flex flex-col gap-5">
      {groupLogsByDate(logs).map((group) => (
        <section key={group.date} aria-labelledby={`day-${group.date}`}>
          <Text
            as="h3"
            id={`day-${group.date}`}
            size="body-sm"
            weight="semibold"
            color="secondary"
            className="mb-2"
          >
            {formatDiaryDate(group.date)}
          </Text>
          <ul className="flex flex-col gap-3">
            {group.logs.map((log) => (
              <DiaryTimelineItem
                key={log.id}
                log={log}
                isSelected={log.id === selectedId}
                onSelect={onSelect}
                {...actions}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

interface DiaryTimelineItemProps extends DiaryLogActions {
  log: DiaryLog;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

function DiaryTimelineItem({
  log,
  isSelected,
  onSelect,
  onEdit,
  onDuplicate,
  onToggleArchive,
  onDelete,
}: DiaryTimelineItemProps) {
  const duration = formatDuration(log.durationMinutes);

  return (
    <li className="relative">
      <button
        type="button"
        aria-current={isSelected ? "true" : undefined}
        onClick={() => onSelect(log.id)}
        className={cn(
          "flex min-h-11 w-full cursor-pointer flex-col gap-1.5 rounded-standard border-2 border-border-strong p-3 pr-14 text-left shadow-raised",
          "transition-[translate,box-shadow] duration-[var(--duration-fast)] motion-reduce:transition-none",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-border-focus",
          isSelected
            ? "translate-x-0.5 translate-y-0.5 bg-accent-lime text-ink shadow-none"
            : "bg-surface-card text-text-primary active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
        )}
      >
        <span className="flex flex-wrap items-center gap-2">
          <Badge size="sm" variant={SKILL_BADGE_VARIANT[log.skill]}>
            {SKILL_LABELS[log.skill]}
          </Badge>
          {duration && <span className="text-body-sm">{duration}</span>}
          <Badge
            size="sm"
            variant={log.status === "completed" ? "success" : "warning"}
            dot
          >
            {STATUS_LABELS[log.status]}
          </Badge>
        </span>
        <span className="font-heading text-body-md font-semibold">
          {log.title}
        </span>
        {log.goal && (
          <span
            className={cn(
              "line-clamp-2 text-body-sm",
              isSelected ? "text-ink" : "text-text-muted",
            )}
          >
            {log.goal}
          </span>
        )}
      </button>
      <DropdownMenu className="absolute top-2 right-2">
        <MenuTrigger>
          <IconButton
            icon={MoreHorizontal}
            variant="ghost"
            size="compact"
            aria-label={`Tuỳ chọn cho ${log.title}`}
          />
        </MenuTrigger>
        <MenuContent align="end">
          <MenuItem icon={Pencil} onSelect={() => onEdit(log)}>
            Chỉnh sửa
          </MenuItem>
          <MenuItem icon={Copy} onSelect={() => onDuplicate(log)}>
            Nhân bản
          </MenuItem>
          <MenuItem
            icon={log.isArchived ? ArchiveRestore : Archive}
            onSelect={() => onToggleArchive(log)}
          >
            {log.isArchived ? "Bỏ lưu trữ" : "Lưu trữ"}
          </MenuItem>
          <MenuItem icon={Trash2} destructive onSelect={() => onDelete(log)}>
            Xoá
          </MenuItem>
        </MenuContent>
      </DropdownMenu>
    </li>
  );
}
