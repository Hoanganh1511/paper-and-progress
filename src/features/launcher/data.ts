import { FolderKanban, Newspaper, NotebookPen } from "lucide-react";
import type { LauncherModule } from "./types";

/** The app's modules, in launcher order. */
export const LAUNCHER_MODULES: LauncherModule[] = [
  {
    id: "projects",
    label: "Dự án",
    href: "/projects",
    group: "practice",
    icon: FolderKanban,
  },
  {
    id: "daily-logs",
    label: "Daily Logs",
    href: "/devlog",
    group: "core",
    icon: NotebookPen,
  },
  {
    id: "posts",
    label: "Bài viết",
    href: "/posts",
    group: "explore",
    icon: Newspaper,
  },
];
