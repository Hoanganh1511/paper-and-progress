"use client";

import { useId, useState, type FormEvent } from "react";
import { ListChecks, Minus, Plus, Trash2 } from "lucide-react";
import {
  Badge,
  Button,
  Checkbox,
  IconButton,
  ProgressBar,
  Text,
  cn,
} from "@/design-system";
import { PRIORITY_LABELS, STATUS_LABELS } from "../../data";
import {
  ALL_CATEGORIES,
  computeProgress,
  countOpen,
  filterTodos,
  listCategories,
  nextStatus,
  sortTodos,
  toggleDoneStatus,
  type DevTodoFilters,
} from "../../todos";
import type { DevTodo, DevTodoPriority, DevTodoStatus } from "../../types";
import { useDevTodos } from "../../useDevTodos";

const STATUS_FILTERS: DevTodoFilters["status"][] = [
  "all",
  "pending",
  "in_progress",
  "done",
];

const PRIORITY_BADGE = {
  low: "default",
  medium: "warning",
  high: "danger",
} as const satisfies Record<DevTodoPriority, string>;

const selectClasses =
  "h-11 min-w-0 flex-1 rounded-standard border-2 border-border-strong bg-surface-card px-2 text-body-sm text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-border-focus";

/**
 * Developer-only checklist pinned to the bottom-right of every page: a round
 * button that opens a todo panel. Render it only in development.
 */
export function DevTodoWidget() {
  const panelId = useId();
  const {
    todos,
    state,
    actionError,
    actions: { add, update, remove, reload },
  } = useDevTodos();
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<DevTodoFilters>({
    status: "all",
    category: ALL_CATEGORIES,
  });
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<DevTodoPriority>("medium");
  const [category, setCategory] = useState("");

  const categories = listCategories(todos);
  const visible = sortTodos(filterTodos(todos, filters));
  const progress = computeProgress(todos);
  const openCount = state === "ready" ? countOpen(todos) : 0;

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    await add({
      title: trimmed,
      priority,
      category: category || categories[0],
    });
    setTitle("");
  }

  function setStatus(todo: DevTodo, status: DevTodoStatus) {
    void update(todo.id, { status });
  }

  return (
    <div
      // The wrapper is as big as the panel even when the panel is closed (it
      // fades out instead of unmounting), and it sits above everything. Without
      // pointer-events-none it would swallow clicks meant for what is behind it,
      // e.g. the header menus. Only the button and an open panel take the mouse.
      className="pointer-events-none fixed right-4 bottom-24 z-[9999] flex flex-col items-end gap-3"
      onKeyDown={(event) => {
        if (event.key === "Escape") setIsOpen(false);
      }}
    >
      <section
        id={panelId}
        aria-label="Dev todo"
        inert={!isOpen}
        className={cn(
          "flex max-h-[min(42rem,calc(100dvh-9rem))] w-[min(22.5rem,calc(100vw-2rem))] flex-col gap-3 rounded-standard border-2 border-border-strong bg-surface-card p-4 text-text-primary shadow-modal",
          "origin-bottom-right transition-[opacity,translate,scale,visibility] duration-[var(--duration-normal)] motion-reduce:transition-none",
          isOpen
            ? "pointer-events-auto visible translate-y-0 scale-100 opacity-100"
            : "invisible translate-y-2 scale-95 opacity-0",
        )}
      >
        <header className="flex items-center justify-between gap-2">
          <Text as="h2" size="heading-sm" weight="semibold">
            Dev Todo
          </Text>
          <IconButton
            icon={Minus}
            variant="ghost"
            size="compact"
            aria-label="Thu gọn Dev Todo"
            onClick={() => setIsOpen(false)}
          />
        </header>

        <ProgressBar label="Tiến độ hoàn thành" value={progress} showValue />

        <div className="flex flex-col gap-2">
          <div
            role="group"
            aria-label="Lọc theo trạng thái"
            className="flex flex-wrap gap-1.5"
          >
            {STATUS_FILTERS.map((status) => {
              const isActive = filters.status === status;
              return (
                <Button
                  key={status}
                  size="compact"
                  variant={isActive ? "accent" : "outline"}
                  aria-pressed={isActive}
                  className={cn(
                    isActive && "translate-x-0.5 translate-y-0.5 shadow-none",
                  )}
                  onClick={() => setFilters((prev) => ({ ...prev, status }))}
                >
                  {status === "all" ? "Tất cả" : STATUS_LABELS[status]}
                </Button>
              );
            })}
          </div>
          <select
            aria-label="Lọc theo category"
            value={filters.category}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, category: event.target.value }))
            }
            className={cn(selectClasses, "flex-none")}
          >
            <option value={ALL_CATEGORIES}>Mọi category</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <ul className="flex min-h-64 flex-1 flex-col gap-2 overflow-y-auto p-1">
          {state === "loading" && (
            <li role="status">
              <Text size="body-sm" color="secondary">
                Đang tải task...
              </Text>
            </li>
          )}
          {state === "error" && (
            <li className="flex flex-col items-start gap-2">
              <Text size="body-sm" color="secondary">
                Không kết nối được API dev-todos (backend chạy ở cổng 8000
                chưa?).
              </Text>
              <Button size="compact" variant="outline" onClick={reload}>
                Thử lại
              </Button>
            </li>
          )}
          {state === "ready" && visible.length === 0 && (
            <li>
              <Text size="body-sm" color="secondary">
                Không có task nào khớp bộ lọc.
              </Text>
            </li>
          )}
          {visible.map((todo) => (
            <li
              key={todo.id}
              className="flex items-start gap-2 rounded-standard border-2 border-border-strong bg-surface-page p-2"
            >
              <Checkbox
                aria-label={`Đánh dấu xong: ${todo.title}`}
                checked={todo.status === "done"}
                onChange={() => setStatus(todo, toggleDoneStatus(todo.status))}
              />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <button
                  type="button"
                  title="Đổi trạng thái"
                  onClick={() => setStatus(todo, nextStatus(todo.status))}
                  className={cn(
                    "min-h-11 cursor-pointer text-left text-body-sm break-words focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-border-focus",
                    todo.status === "done" && "text-text-muted line-through",
                  )}
                >
                  {todo.title}
                  <span className="sr-only">
                    {`. Trạng thái: ${STATUS_LABELS[todo.status]}`}
                  </span>
                </button>
                <span className="flex flex-wrap gap-1.5">
                  <Badge
                    size="sm"
                    variant={todo.status === "in_progress" ? "blue" : "default"}
                  >
                    {STATUS_LABELS[todo.status]}
                  </Badge>
                  <Badge size="sm" variant={PRIORITY_BADGE[todo.priority]}>
                    {PRIORITY_LABELS[todo.priority]}
                  </Badge>
                  <Badge size="sm">{todo.category}</Badge>
                </span>
              </div>
              <IconButton
                icon={Trash2}
                variant="ghost"
                size="compact"
                aria-label={`Xoá task: ${todo.title}`}
                onClick={() => void remove(todo.id)}
              />
            </li>
          ))}
        </ul>

        {actionError && (
          <Text as="p" role="alert" size="body-sm" className="text-danger-text">
            Không lưu được thay đổi. Kiểm tra backend rồi thử lại.
          </Text>
        )}

        <form onSubmit={handleAdd} className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              aria-label="Tên task mới"
              placeholder="Thêm task mới..."
              value={title}
              autoComplete="off"
              onChange={(event) => setTitle(event.target.value)}
              className="h-11 min-w-0 flex-1 rounded-standard border-2 border-border-strong bg-surface-card px-3 text-body-sm placeholder:text-text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-border-focus"
            />
            <Button type="submit" variant="accent" leftIcon={Plus}>
              Add
            </Button>
          </div>
          <div className="flex gap-2">
            <select
              aria-label="Độ ưu tiên"
              value={priority}
              onChange={(event) =>
                setPriority(event.target.value as DevTodoPriority)
              }
              className={selectClasses}
            >
              {(Object.keys(PRIORITY_LABELS) as DevTodoPriority[]).map(
                (item) => (
                  <option key={item} value={item}>
                    {`Ưu tiên: ${PRIORITY_LABELS[item]}`}
                  </option>
                ),
              )}
            </select>
            <select
              aria-label="Category của task mới"
              value={category || categories[0]}
              onChange={(event) => setCategory(event.target.value)}
              className={selectClasses}
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </form>
      </section>

      <button
        type="button"
        aria-label={
          state === "ready"
            ? `Dev Todo, còn ${openCount} task chưa xong`
            : "Dev Todo"
        }
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((value) => !value)}
        className={cn(
          "pointer-events-auto relative flex size-12 cursor-pointer items-center justify-center rounded-pill border-2 border-border-strong bg-accent-blue text-ink shadow-accent",
          "transition-[translate,box-shadow] duration-[var(--duration-fast)] motion-reduce:transition-none",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-border-focus",
          "active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
          isOpen && "translate-x-0.5 translate-y-0.5 shadow-none",
        )}
      >
        <ListChecks aria-hidden="true" size={22} />
        {openCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute -top-2 -right-2 flex h-6 min-w-6 items-center justify-center rounded-pill border-2 border-border-strong bg-accent-yellow px-1 text-caption font-semibold text-ink"
          >
            {openCount}
          </span>
        )}
      </button>
    </div>
  );
}
