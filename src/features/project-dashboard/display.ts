import {
  Ban,
  Check,
  CheckCircle2,
  CircleDashed,
  Cloud,
  Database,
  FileText,
  Folder,
  Monitor,
  Palette,
  Server,
  ShieldCheck,
  Timer,
  X,
  type LucideIcon,
} from "lucide-react";
import type {
  ActivityItem,
  CriteriaPriority,
  CriteriaStatistics,
  CriteriaStatus,
  IssueType,
  ProjectHealth,
} from "./types";

export const STATUS_LABELS: Record<CriteriaStatus, string> = {
  COMPLETED: "Completed",
  IN_PROGRESS: "In Progress",
  NOT_STARTED: "Not Started",
  BLOCKED: "Blocked",
};

export const STATUS_ORDER: CriteriaStatus[] = [
  "COMPLETED",
  "IN_PROGRESS",
  "NOT_STARTED",
  "BLOCKED",
];

/** Icon and colour of a criterion's status, in lists and in the detail panel. */
export const STATUS_ICONS: Record<
  CriteriaStatus,
  { icon: LucideIcon; className: string }
> = {
  COMPLETED: { icon: Check, className: "text-success-text" },
  IN_PROGRESS: { icon: Timer, className: "text-info-text" },
  NOT_STARTED: { icon: CircleDashed, className: "text-text-muted" },
  BLOCKED: { icon: X, className: "text-danger-text" },
};

export const STATUS_BADGE_VARIANT = {
  COMPLETED: "success",
  IN_PROGRESS: "blue",
  NOT_STARTED: "default",
  BLOCKED: "danger",
} as const satisfies Record<CriteriaStatus, string>;

export const PRIORITY_LABELS: Record<CriteriaPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

export const PRIORITY_BADGE_VARIANT = {
  LOW: "default",
  MEDIUM: "warning",
  HIGH: "danger",
} as const satisfies Record<CriteriaPriority, string>;

export const HEALTH_LABELS: Record<ProjectHealth, string> = {
  ON_TRACK: "On Track",
  AT_RISK: "At Risk",
  NEEDS_ATTENTION: "Needs Attention",
};

export const HEALTH_BADGE_VARIANT = {
  ON_TRACK: "success",
  AT_RISK: "warning",
  NEEDS_ATTENTION: "danger",
} as const satisfies Record<ProjectHealth, string>;

export const ISSUE_LABELS: Record<IssueType, string> = {
  BLOCKED: "Blocked",
  OVERDUE: "Overdue",
};

export const ISSUE_BADGE_VARIANT = {
  BLOCKED: "danger",
  OVERDUE: "warning",
} as const satisfies Record<IssueType, string>;

export const STAT_ICON_FOR_STATUS = {
  COMPLETED: CheckCircle2,
  IN_PROGRESS: Timer,
  NOT_STARTED: CircleDashed,
  BLOCKED: Ban,
} as const satisfies Record<CriteriaStatus, LucideIcon>;

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  monitor: Monitor,
  server: Server,
  database: Database,
  shield: ShieldCheck,
  cloud: Cloud,
  "check-circle": CheckCircle2,
  palette: Palette,
  "file-text": FileText,
};

export const CATEGORY_ICON_NAMES = Object.keys(CATEGORY_ICONS);

/** Shown for a category whose icon name is missing or unknown. */
export const FALLBACK_CATEGORY_ICON: LucideIcon = Folder;

/** How much of a category is done, 0 to 100. */
export function completedShare({ completed, total }: CriteriaStatistics) {
  return total === 0 ? 0 : (completed / total) * 100;
}

/** Fill colour of a category's progress bar: green above 80%, blue to 50%, orange to 30%, else red. */
export function progressColor(share: number): string {
  if (share > 80) return "bg-success-text";
  if (share >= 50) return "bg-info-text";
  if (share >= 30) return "bg-[#d97706]";
  return "bg-danger-text";
}

const ACTIVITY_DOT = {
  lime: "bg-accent-lime",
  blue: "bg-info-text",
  pink: "bg-accent-pink",
  yellow: "bg-accent-yellow",
  purple: "bg-[#a78bfa]",
  gray: "bg-text-muted",
  sky: "bg-accent-blue",
} as const;

/** Colour of an activity's dot: a status change by the status it moved to, others by type. */
export function activityDotClass(activity: ActivityItem): string {
  switch (activity.type) {
    case "STATUS_CHANGED":
      if (activity.newValue === "COMPLETED") return ACTIVITY_DOT.lime;
      if (activity.newValue === "IN_PROGRESS") return ACTIVITY_DOT.blue;
      if (activity.newValue === "BLOCKED") return ACTIVITY_DOT.pink;
      return ACTIVITY_DOT.gray;
    case "CRITERIA_UPDATED":
      return ACTIVITY_DOT.yellow;
    case "CRITERIA_CREATED":
      return ACTIVITY_DOT.purple;
    case "NOTE_ADDED":
      return ACTIVITY_DOT.sky;
    default:
      return ACTIVITY_DOT.gray;
  }
}

export const ACTIVITY_TYPE_LABELS: Record<ActivityItem["type"], string> = {
  STATUS_CHANGED: "Đổi trạng thái",
  CRITERIA_CREATED: "Tạo tiêu chí",
  CRITERIA_UPDATED: "Cập nhật tiêu chí",
  CRITERIA_DELETED: "Xóa tiêu chí",
  CATEGORY_CREATED: "Tạo danh mục",
  CATEGORY_DELETED: "Xóa danh mục",
  NOTE_ADDED: "Ghi chú",
};

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const dateTimeFormat = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** "30/10/2026" */
export const formatDate = (iso: string) => dateFormat.format(new Date(iso));

/** "30/10/2026, 14:32" with the comma removed: "30/10/2026 14:32". */
export const formatDateTime = (iso: string) =>
  dateTimeFormat.format(new Date(iso)).replace(",", "");

/** `YYYY-MM-DD` of an ISO date-time, in the viewer's time zone. */
export function toDateInput(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** True for an unfinished criterion whose deadline day is before today. */
export function isOverdue(
  deadline: string | null,
  status: CriteriaStatus,
  now = new Date(),
): boolean {
  if (!deadline || status === "COMPLETED") return false;
  return toDateInput(deadline) < toDateInput(now.toISOString());
}
