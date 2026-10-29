export type DevTodoStatus = "pending" | "in_progress" | "done";

export type DevTodoPriority = "low" | "medium" | "high";

/** A todo as the backend returns it. */
export interface DevTodo {
  id: string;
  title: string;
  status: DevTodoStatus;
  priority: DevTodoPriority;
  category: string;
  /** ISO timestamps. */
  createdAt: string;
  updatedAt: string;
  /** Set by the backend while the status is "done". */
  completedAt: string | null;
}
