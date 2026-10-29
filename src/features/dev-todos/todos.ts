import { DEFAULT_CATEGORIES } from "./data";
import type { DevTodo, DevTodoPriority, DevTodoStatus } from "./types";

export interface DevTodoFilters {
  status: DevTodoStatus | "all";
  category: string;
}

export const ALL_CATEGORIES = "all";

/** Label click: pending -> in_progress -> done -> pending. */
export function nextStatus(status: DevTodoStatus): DevTodoStatus {
  if (status === "pending") return "in_progress";
  if (status === "in_progress") return "done";
  return "pending";
}

/** Checkbox click: anything not done becomes done; done goes back to pending. */
export function toggleDoneStatus(status: DevTodoStatus): DevTodoStatus {
  return status === "done" ? "pending" : "done";
}

export function filterTodos(
  todos: DevTodo[],
  filters: DevTodoFilters,
): DevTodo[] {
  return todos.filter(
    (todo) =>
      (filters.status === "all" || todo.status === filters.status) &&
      (filters.category === ALL_CATEGORIES ||
        todo.category === filters.category),
  );
}

/** Percentage of todos that are done, 0 when there are none. */
export function computeProgress(todos: DevTodo[]): number {
  if (todos.length === 0) return 0;
  const done = todos.filter((todo) => todo.status === "done").length;
  return Math.round((done / todos.length) * 100);
}

export function countOpen(todos: DevTodo[]): number {
  return todos.filter((todo) => todo.status !== "done").length;
}

/** The default categories, then any others the todos use. */
export function listCategories(todos: DevTodo[]): string[] {
  const extra = todos
    .map((todo) => todo.category)
    .filter((category) => !DEFAULT_CATEGORIES.includes(category));
  return [...DEFAULT_CATEGORIES, ...new Set(extra)];
}

const PRIORITY_RANK: Record<DevTodoPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

/** High priority first, done last; otherwise the backend's order is kept. */
export function sortTodos(todos: DevTodo[]): DevTodo[] {
  const rank = (todo: DevTodo) =>
    (todo.status === "done" ? 3 : 0) + PRIORITY_RANK[todo.priority];
  return [...todos].sort((a, b) => rank(a) - rank(b));
}
