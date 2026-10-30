export type CriteriaStatus =
  "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED";

export type CriteriaPriority = "LOW" | "MEDIUM" | "HIGH";

export type ProjectHealth = "ON_TRACK" | "AT_RISK" | "NEEDS_ATTENTION";

/** The ways a criterion is stuck that the dashboard shows. */
export type IssueType = "BLOCKED" | "OVERDUE";

export type ActivityType =
  | "STATUS_CHANGED"
  | "CRITERIA_CREATED"
  | "CRITERIA_UPDATED"
  | "CRITERIA_DELETED"
  | "CATEGORY_CREATED"
  | "CATEGORY_DELETED"
  | "NOTE_ADDED";

export interface CriteriaStatistics {
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  blocked: number;
}

export interface IssueItem {
  id: string;
  title: string;
  description: string | null;
  status: CriteriaStatus;
  categoryName: string;
  issueTypes: IssueType[];
}

export interface DashboardStats {
  project: {
    name: string;
    description: string | null;
    health: ProjectHealth;
    updatedAt: string;
  };
  statistics: CriteriaStatistics;
  outstanding: {
    overdue: number;
  };
  /** The top three issues for the sidebar. */
  issues: IssueItem[];
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  /** An icon name such as "monitor"; see `categoryIcon`. */
  icon: string | null;
  sortOrder: number;
  stats: CriteriaStatistics;
}

export interface Criterion {
  id: string;
  categoryId: string;
  title: string;
  description: string | null;
  status: CriteriaStatus;
  priority: CriteriaPriority;
  /** ISO date-time, or null. */
  deadline: string | null;
  notes: string | null;
  evidenceUrl: string | null;
  completedAt: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CriterionListItem extends Criterion {
  category: { id: string; name: string; icon: string | null };
}

export interface Activity {
  id: string;
  criteriaId: string | null;
  categoryId: string | null;
  type: ActivityType;
  title: string;
  description: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
}

export interface ActivityItem extends Activity {
  /** Null when the category or the criterion has since been deleted. */
  categoryName: string | null;
}

export interface CriterionDetail extends Criterion {
  category: { id: string; name: string };
  activities: Activity[];
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

/** What the criteria list is narrowed to, shared by the overview and the list. */
export type DashboardFilter =
  | { kind: "all" }
  | { kind: "status"; status: CriteriaStatus }
  | { kind: "issue"; issue: "OVERDUE" };

export interface NewCriterion {
  categoryId: string;
  title: string;
  description?: string;
  status?: CriteriaStatus;
  priority?: CriteriaPriority;
  deadline?: string;
  notes?: string;
  evidenceUrl?: string;
}

/** `deadline` takes null to clear it. */
export type CriterionPatch = Partial<
  Omit<NewCriterion, "deadline"> & {
    deadline: string | null;
    sortOrder: number;
  }
>;

export interface NewCategory {
  name: string;
  description?: string;
  icon?: string;
}

export type CategoryPatch = Partial<NewCategory & { sortOrder: number }>;

export interface OrderItem {
  id: string;
  sortOrder: number;
}

export interface ProjectConfig {
  id: string;
  name: string;
  description: string | null;
  health: ProjectHealth;
  updatedAt: string;
}
