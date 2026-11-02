import axios from "axios";
import { authedApi } from "@/features/auth";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/v1`;

export interface MembershipStatus {
  isMember: boolean;
  /** When the membership ends (or ended); null if the user never was a member. */
  expiresAt: string | null;
  source: "ADMIN" | "PAYMENT" | null;
}

export type MembershipPlanId = "MONTH" | "YEAR";

export interface MembershipPlan {
  plan: MembershipPlanId;
  label: string;
  months: number;
  /** In VND. */
  amount: number;
}

export interface MembershipPlans {
  /** False until the owner has set prices and a bank account. */
  isOpen: boolean;
  plans: MembershipPlan[];
}

export interface MembershipOrder {
  id: string;
  plan: MembershipPlanId;
  months: number;
  amount: number;
  /** The note the reader puts on the bank transfer. */
  code: string;
  status: "PENDING" | "PAID" | "CANCELLED";
  createdAt: string;
  paidAt: string | null;
  /** Only while the order is waiting for money. */
  payment: {
    bankBin: string;
    accountNo: string;
    accountName: string;
    qrUrl: string;
  } | null;
}

/** The backend's own message when it sent one, so the reader sees why. */
function fail(error: unknown, fallback: string): never {
  const message = axios.isAxiosError(error)
    ? (error.response?.data as { message?: unknown } | undefined)?.message
    : undefined;
  throw new Error(typeof message === "string" ? message : fallback);
}

/** The signed-in reader's own membership. */
export const getMyMembership = async () =>
  (await authedApi.get<MembershipStatus>("/membership/me")).data;

export async function getMembershipPlans(): Promise<MembershipPlans> {
  const response = await fetch(`${API_BASE}/membership/plans`, {
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Không tải được các gói hội viên.");
  return response.json() as Promise<MembershipPlans>;
}

/** Opens an order for a plan (or returns the one already waiting). */
export const createMembershipOrder = async (plan: MembershipPlanId) => {
  try {
    return (
      await authedApi.post<MembershipOrder>("/membership/orders", { plan })
    ).data;
  } catch (error) {
    return fail(error, "Không tạo được đơn. Bạn thử lại nhé.");
  }
};

export const getMyMembershipOrders = async () =>
  (await authedApi.get<MembershipOrder[]>("/membership/orders/me")).data;

export const cancelMyMembershipOrder = async (id: string) => {
  try {
    await authedApi.post(`/membership/orders/${id}/cancel`);
  } catch (error) {
    fail(error, "Không huỷ được đơn.");
  }
};
