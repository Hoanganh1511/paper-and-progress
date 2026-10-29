"use client";

import { useMemo, useState } from "react";
import { Archive, Plus } from "lucide-react";
import {
  AlertDialog,
  Button,
  EmptyState,
  SearchInput,
  Text,
} from "@/design-system";
import { deleteLog, saveLog, useDiaryLogs } from "../../logStore";
import {
  SKILLS,
  SKILL_LABELS,
  createEmptyDraft,
  duplicateLog,
  filterLogs,
} from "../../logs";
import type { DiaryLog, DiaryLogDraft, DiarySkill } from "../../types";
import { DiaryLogDialog } from "../DiaryLogDialog";
import { DiaryDetail } from "./DiaryDetail";
import { DiaryTimeline } from "./DiaryTimeline";

type Editing = { mode: "create" } | { mode: "edit"; log: DiaryLog };

const ALL = "all";

/**
 * The English diary: a timeline of study sessions on the left, the selected
 * session on the right. Skills are filters, not separate pages.
 */
export function EnglishDiary() {
  const logs = useDiaryLogs();
  const [query, setQuery] = useState("");
  const [skill, setSkill] = useState<DiarySkill | typeof ALL>(ALL);
  const [isArchived, setIsArchived] = useState(false);
  const [selectedId, setSelectedId] = useState<string>();
  const [editing, setEditing] = useState<Editing>();
  const [deleting, setDeleting] = useState<DiaryLog>();

  const visible = useMemo(
    () => filterLogs(logs, { query, skill, isArchived }),
    [logs, query, skill, isArchived],
  );
  // Opens on the newest log; falls back to it when the selection is filtered out.
  const selected = visible.find((log) => log.id === selectedId) ?? visible[0];

  function handleSubmit(draft: DiaryLogDraft) {
    if (!editing) return;
    if (editing.mode === "edit") {
      saveLog({ ...editing.log, ...draft });
      setSelectedId(editing.log.id);
    } else {
      const log: DiaryLog = {
        ...draft,
        id: crypto.randomUUID(),
        isArchived: false,
        createdAt: new Date().toISOString(),
      };
      saveLog(log);
      // A new log must be visible: drop filters that would hide it.
      setQuery("");
      setSkill(ALL);
      setIsArchived(false);
      setSelectedId(log.id);
    }
    setEditing(undefined);
  }

  function handleDuplicate(log: DiaryLog) {
    const copy = duplicateLog(log, crypto.randomUUID(), new Date());
    saveLog(copy);
    setIsArchived(false);
    setSelectedId(copy.id);
  }

  function handleConfirmDelete() {
    if (deleting) deleteLog(deleting.id);
    setDeleting(undefined);
  }

  const hasFilters = query.trim() !== "" || skill !== ALL;

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          aria-label="Tìm kiếm log"
          placeholder="Tìm kiếm log..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onClear={() => setQuery("")}
          clearLabel="Xoá tìm kiếm"
          className="min-w-48 flex-1 sm:max-w-sm"
        />
        <Button
          variant="accent"
          leftIcon={Plus}
          onClick={() => setEditing({ mode: "create" })}
        >
          Tạo log mới
        </Button>
      </div>

      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Lọc theo kỹ năng"
      >
        {[ALL, ...SKILLS].map((item) => (
          <Button
            key={item}
            size="compact"
            variant={skill === item ? "accent" : "outline"}
            aria-pressed={skill === item}
            className={
              skill === item
                ? "translate-x-0.5 translate-y-0.5 shadow-none"
                : undefined
            }
            onClick={() => setSkill(item as DiarySkill | typeof ALL)}
          >
            {item === ALL ? "Tất cả" : SKILL_LABELS[item as DiarySkill]}
          </Button>
        ))}
        <Button
          size="compact"
          variant={isArchived ? "accent" : "outline"}
          leftIcon={Archive}
          aria-pressed={isArchived}
          className={
            isArchived
              ? "translate-x-0.5 translate-y-0.5 shadow-none"
              : undefined
          }
          onClick={() => setIsArchived((value) => !value)}
        >
          Đã lưu trữ
        </Button>
      </div>

      <div className="grid min-h-0 flex-1 gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <section
          aria-label="Learning Timeline"
          className="min-h-0 overflow-y-auto p-1 lg:pr-3"
        >
          {visible.length === 0 ? (
            <EmptyState
              title={
                hasFilters
                  ? "Không tìm thấy log nào"
                  : isArchived
                    ? "Chưa có log nào được lưu trữ"
                    : "Chưa có log nào"
              }
              description={
                hasFilters
                  ? "Thử đổi từ khoá hoặc bỏ bộ lọc kỹ năng."
                  : "Bấm “Tạo log mới” để ghi lại buổi học đầu tiên."
              }
            />
          ) : (
            <DiaryTimeline
              logs={visible}
              selectedId={selected?.id}
              onSelect={setSelectedId}
              onEdit={(log) => setEditing({ mode: "edit", log })}
              onDuplicate={handleDuplicate}
              onToggleArchive={(log) =>
                saveLog({ ...log, isArchived: !log.isArchived })
              }
              onDelete={setDeleting}
            />
          )}
        </section>

        <section
          aria-label="Learning Session"
          className="min-h-0 overflow-y-auto rounded-standard border-2 border-border-strong bg-surface-card p-5 shadow-raised lg:p-6"
        >
          {selected ? (
            <DiaryDetail
              log={selected}
              onEdit={(log) => setEditing({ mode: "edit", log })}
            />
          ) : (
            <Text color="secondary">Chọn một log để xem chi tiết.</Text>
          )}
        </section>
      </div>

      {editing && (
        <DiaryLogDialog
          key={editing.mode === "edit" ? editing.log.id : "create"}
          open
          mode={editing.mode}
          initial={editing.mode === "edit" ? editing.log : createEmptyDraft()}
          onClose={() => setEditing(undefined)}
          onSubmit={handleSubmit}
        />
      )}
      <AlertDialog
        open={deleting !== undefined}
        variant="destructive"
        title="Xoá log này?"
        description={
          deleting
            ? `“${deleting.title}” sẽ bị xoá vĩnh viễn. Nếu chỉ muốn ẩn khỏi timeline, hãy lưu trữ.`
            : undefined
        }
        confirmLabel="Xoá"
        cancelLabel="Huỷ"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleting(undefined)}
      />
    </div>
  );
}
