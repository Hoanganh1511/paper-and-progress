import type { DevTodo } from "./types";

const STAMP = "2026-10-29T02:45:05.694Z";

function todo(
  id: string,
  title: string,
  status: DevTodo["status"],
  priority: DevTodo["priority"],
  category: string,
): DevTodo {
  return {
    id,
    title,
    status,
    priority,
    category,
    createdAt: STAMP,
    updatedAt: STAMP,
    completedAt: status === "done" ? STAMP : null,
  };
}

/** Test data shaped like the backend's seeded list (6 done, 4 open). */
export const TODO_FIXTURES: DevTodo[] = [
  todo("1", "Auth - Register/Login/Logout", "done", "high", "Auth"),
  todo("2", "Auth - Refresh Token", "done", "high", "Auth"),
  todo("3", "Auth - Forgot Password + Email", "done", "high", "Auth"),
  todo("4", "Auth - Rate Limiting (Throttler)", "done", "medium", "Auth"),
  todo("5", "Auth - Brute Force Detection", "done", "medium", "Auth"),
  todo("6", "Auth - Token Rotation", "done", "medium", "Auth"),
  todo("7", "Profile - Trang hồ sơ người dùng", "pending", "high", "Profile"),
  todo("8", "Profile - Upload avatar (S3)", "pending", "medium", "Profile"),
  todo("9", "Profile - Đổi mật khẩu", "pending", "medium", "Profile"),
  todo("10", "Profile - Dark mode / Theme", "pending", "low", "UI/UX"),
];
