import type { LucideIcon } from "lucide-react";

export type LauncherGroup =
  "core" | "practice" | "explore" | "community" | "personal" | "system";

export interface LauncherModule {
  id: string;
  label: string;
  /** Where the module lives. */
  href: string;
  group: LauncherGroup;
  /** Illustration drawn in the circle when there is no `image`. */
  icon: LucideIcon;
  /** Picture for the circle; replaces the icon when given. */
  image?: string;
}
