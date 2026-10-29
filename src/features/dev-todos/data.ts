import type { DevTodoPriority, DevTodoStatus } from "./types";

export const DEFAULT_CATEGORIES = [
  "Auth",
  "Profile",
  "UI/UX",
  "Backend",
  "Frontend",
  "DevOps",
  "Database",
  "Testing",
];

export const STATUS_LABELS: Record<DevTodoStatus, string> = {
  pending: "Chờ làm",
  in_progress: "Đang làm",
  done: "Xong",
};

export const PRIORITY_LABELS: Record<DevTodoPriority, string> = {
  low: "Thấp",
  medium: "Vừa",
  high: "Cao",
};
