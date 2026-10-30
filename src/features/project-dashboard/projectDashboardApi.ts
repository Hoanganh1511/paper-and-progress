import axios from "axios";
import { authedApi } from "@/features/auth";
import type {
  ActivityItem,
  ActivityType,
  Category,
  CategoryPatch,
  CriteriaStatus,
  CriterionDetail,
  CriterionListItem,
  CriterionPatch,
  DashboardStats,
  IssueItem,
  IssueType,
  NewCategory,
  NewCriterion,
  OrderItem,
  Paged,
  ProjectConfig,
  ProjectHealth,
} from "./types";

/** A failed dashboard call, carrying the message to show. */
export class DashboardApiError extends Error {
  readonly status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.name = "DashboardApiError";
    this.status = status;
  }
}

async function call<T>(request: Promise<{ data: T }>): Promise<T> {
  try {
    return (await request).data;
  } catch (error) {
    if (!axios.isAxiosError(error) || !error.response) {
      throw new DashboardApiError("Không kết nối được máy chủ. Thử lại sau.");
    }
    const { status, data } = error.response;
    const raw = (data as { message?: unknown } | undefined)?.message;
    const message = Array.isArray(raw)
      ? raw.map(String).join(" ")
      : typeof raw === "string"
        ? raw
        : "Có lỗi xảy ra. Thử lại sau.";
    throw new DashboardApiError(message, status);
  }
}

/** Drops empty values so they are not sent as `?search=`. */
function clean(params: object) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== "" && value != null),
  );
}

const base = "/project-dashboard";

/**
 * The backend can also flag an issue as needing review or discussion; the
 * dashboard no longer shows those. An issue that is stuck in no other way is dropped.
 */
const SHOWN_ISSUE_TYPES: readonly string[] = ["BLOCKED", "OVERDUE"];

function onlyShownIssues(issues: IssueItem[]): IssueItem[] {
  return issues
    .map((issue) => ({
      ...issue,
      issueTypes: issue.issueTypes.filter((type) =>
        SHOWN_ISSUE_TYPES.includes(type),
      ),
    }))
    .filter((issue) => issue.issueTypes.length > 0);
}

export const getStats = async () => {
  const stats = await call(authedApi.get<DashboardStats>(`${base}/stats`));
  return { ...stats, issues: onlyShownIssues(stats.issues) };
};

export const getCategories = () =>
  call(authedApi.get<Category[]>(`${base}/categories`));

export const getCategory = (id: string) =>
  call(authedApi.get<Category>(`${base}/categories/${id}`));

export const createCategory = (data: NewCategory) =>
  call(authedApi.post<Category>(`${base}/categories`, data));

export const updateCategory = (id: string, data: CategoryPatch) =>
  call(authedApi.patch<Category>(`${base}/categories/${id}`, data));

export const deleteCategory = (id: string) =>
  call(authedApi.delete(`${base}/categories/${id}`)).then(() => undefined);

export const reorderCategories = (orders: OrderItem[]) =>
  call(authedApi.patch<Category[]>(`${base}/categories/reorder`, { orders }));

export interface CriteriaParams {
  categoryId?: string;
  status?: CriteriaStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export const getCriteria = (params: CriteriaParams = {}) =>
  call(
    authedApi.get<Paged<CriterionListItem>>(`${base}/criteria`, {
      params: clean(params),
    }),
  );

export const getCriterion = (id: string) =>
  call(authedApi.get<CriterionDetail>(`${base}/criteria/${id}`));

export const createCriterion = (data: NewCriterion) =>
  call(authedApi.post<CriterionListItem>(`${base}/criteria`, data));

export const updateCriterion = (id: string, data: CriterionPatch) =>
  call(authedApi.patch<CriterionListItem>(`${base}/criteria/${id}`, data));

export const deleteCriterion = (id: string) =>
  call(authedApi.delete(`${base}/criteria/${id}`)).then(() => undefined);

export const reorderCriteria = (orders: OrderItem[]) =>
  call(
    authedApi.patch<{ updated: number }>(`${base}/criteria/reorder`, {
      orders,
    }),
  );

export interface IssueParams {
  type?: IssueType;
  page?: number;
  limit?: number;
}

export const getIssues = async (params: IssueParams = {}) => {
  const page = await call(
    authedApi.get<Paged<IssueItem>>(`${base}/issues`, {
      params: clean(params),
    }),
  );
  return { ...page, items: onlyShownIssues(page.items) };
};

export const getRecentActivities = (limit = 5) =>
  call(
    authedApi.get<ActivityItem[]>(`${base}/activities/recent`, {
      params: { limit },
    }),
  );

export interface ActivityParams {
  type?: ActivityType;
  criteriaId?: string;
  page?: number;
  limit?: number;
}

export const getActivities = (params: ActivityParams = {}) =>
  call(
    authedApi.get<Paged<ActivityItem>>(`${base}/activities`, {
      params: clean(params),
    }),
  );

export const getConfig = () =>
  call(authedApi.get<ProjectConfig>(`${base}/config`));

export const updateConfig = (data: {
  name?: string;
  description?: string;
  health?: ProjectHealth;
}) => call(authedApi.patch<ProjectConfig>(`${base}/config`, data));
