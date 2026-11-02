import axios from "axios";
import { authedApi } from "@/features/auth";

export const SECURITY_EVENT_TYPES = [
  "RECAPTCHA_REJECT",
  "HIBP_BLOCK",
  "TOTP_FAIL",
  "RECOVERY_USED",
  "ANOMALY_ALERT",
] as const;

export type SecurityEventType = (typeof SECURITY_EVENT_TYPES)[number];

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminStats {
  users: { total: number; newToday: number; newThisWeek: number };
  logins: { today: number; thisWeek: number };
  /** The last 7 days, oldest first; days without a login are 0. */
  loginsByDay: { date: string; count: number }[];
  twoFactor: { enabled: number; disabled: number };
  securityEventsLast7Days: Partial<Record<SecurityEventType, number>>;
}

export interface AdminUser {
  id: string;
  email: string;
  displayName: string | null;
  role: "USER" | "CREATOR" | "ADMIN";
  isActive: boolean;
  createdAt: string;
  totpEnabled: boolean;
  /** True while the membership end date is still ahead. */
  isMember: boolean;
  membershipExpiresAt: string | null;
  /** `local` for a password account, plus each linked social provider. */
  providers: string[];
  lastLoginAt: string | null;
}

export interface AdminMembership {
  expiresAt: string;
  source: "ADMIN" | "PAYMENT";
}

export interface AdminUserDetail extends Omit<AdminUser, "lastLoginAt"> {
  avatarUrl: string | null;
  /** Null when the user never was a member; may be in the past. */
  membership: AdminMembership | null;
  updatedAt: string;
  totpEnabledAt: string | null;
}

export interface LoginRecord {
  id: string;
  userId: string;
  ip: string;
  userAgent: string | null;
  createdAt: string;
  user: { id: string; email: string };
  /** First time this user signed in from this IP, after having signed in before. */
  isNewIp: boolean;
}

export interface SecurityEventRecord {
  id: string;
  type: SecurityEventType;
  userId: string | null;
  ip: string | null;
  metadata: unknown;
  createdAt: string;
  user: { id: string; email: string } | null;
}

/** A failed admin call; `status` is 403 when the account is not an admin. */
export class AdminApiError extends Error {
  readonly status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
  }
}

async function call<T>(request: Promise<{ data: T }>): Promise<T> {
  try {
    return (await request).data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const raw = (error.response.data as { message?: unknown } | undefined)
        ?.message;
      const message = Array.isArray(raw)
        ? raw.map(String).join(" ")
        : typeof raw === "string"
          ? raw
          : "Có lỗi xảy ra. Thử lại sau.";
      throw new AdminApiError(message, error.response.status);
    }
    throw new AdminApiError("Không kết nối được máy chủ. Thử lại sau.");
  }
}

export interface PageQuery {
  page: number;
  limit?: number;
}

export interface DateRangeQuery {
  /** ISO date-time. */
  from?: string;
  to?: string;
}

/** Drops empty filters so they are not sent as `?search=`. */
function clean(params: object) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== "" && value != null),
  );
}

export const getAdminStats = () =>
  call(authedApi.get<AdminStats>("/admin/stats"));

export const listAdminUsers = (query: PageQuery & { search?: string }) =>
  call(
    authedApi.get<Paged<AdminUser>>("/admin/users", { params: clean(query) }),
  );

export const getAdminUser = (id: string) =>
  call(authedApi.get<AdminUserDetail>(`/admin/users/${id}`));

export const listAdminLoginHistory = (
  query: PageQuery &
    DateRangeQuery & { search?: string; userId?: string; ip?: string },
) =>
  call(
    authedApi.get<Paged<LoginRecord>>("/admin/login-history", {
      params: clean(query),
    }),
  );

export const listAdminSecurityEvents = (
  query: PageQuery & DateRangeQuery & { type?: SecurityEventType },
) =>
  call(
    authedApi.get<Paged<SecurityEventRecord>>("/admin/security-events", {
      params: clean(query),
    }),
  );

/** Changes what a user may do. The role applies to them from their next token refresh. */
export const setAdminUserRole = (id: string, role: AdminUser["role"]) =>
  call(
    authedApi.patch<{ id: string; role: AdminUser["role"] }>(
      `/admin/users/${id}/role`,
      { role },
    ),
  );

/** Sets when the user's membership ends (it has to be in the future). */
export const grantAdminUserMembership = (id: string, expiresAt: string) =>
  call(
    authedApi.put<{ isMember: boolean; expiresAt: string | null }>(
      `/admin/users/${id}/membership`,
      { expiresAt },
    ),
  );

export const revokeAdminUserMembership = (id: string) =>
  call(
    authedApi.delete<{ isMember: boolean; expiresAt: string | null }>(
      `/admin/users/${id}/membership`,
    ),
  );

export type MembershipOrderStatus = "PENDING" | "PAID" | "CANCELLED";

export interface AdminMembershipOrder {
  id: string;
  plan: "MONTH" | "YEAR";
  /** In VND. */
  amount: number;
  /** The note the buyer put on the bank transfer. */
  code: string;
  status: MembershipOrderStatus;
  createdAt: string;
  paidAt: string | null;
  /** What the bank reported, when the order was confirmed automatically. */
  receivedAmount: number | null;
  user: { id: string; email: string; displayName: string | null };
}

export const listAdminMembershipOrders = (status: MembershipOrderStatus) =>
  call(
    authedApi.get<AdminMembershipOrder[]>("/admin/membership-orders", {
      params: { status },
    }),
  );

/** The money has arrived: marks the order paid and grants the membership. */
export const confirmAdminMembershipOrder = (id: string) =>
  call(
    authedApi.post<{ ok: boolean; alreadyPaid: boolean }>(
      `/admin/membership-orders/${id}/confirm`,
    ),
  );

export const cancelAdminMembershipOrder = (id: string) =>
  call(
    authedApi.post<{ ok: boolean }>(`/admin/membership-orders/${id}/cancel`),
  );
