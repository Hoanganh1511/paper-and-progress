import { vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

vi.mock("next/navigation", () => ({ usePathname: () => "/membership/orders" }));

let auth = { isAuthenticated: true, isLoading: false };
vi.mock("@/features/auth", () => ({
  useAuth: () => auth,
  loginHref: (path: string) => `/login?next=${encodeURIComponent(path)}`,
}));

const getMyMembershipOrders = vi.hoisted(() => vi.fn());
vi.mock("../membershipApi", () => ({ getMyMembershipOrders }));

import { OrderHistory } from "./OrderHistory";

const order = (overrides: object) => ({
  id: "o1",
  plan: "MONTH",
  months: 1,
  amount: 39000,
  code: "PPABCDEFGH",
  status: "PENDING",
  createdAt: "2026-11-02T03:00:00.000Z",
  paidAt: null,
  payment: null,
  ...overrides,
});

describe("OrderHistory", () => {
  beforeEach(() => {
    auth = { isAuthenticated: true, isLoading: false };
    getMyMembershipOrders.mockReset();
  });

  it("asks a guest to sign in and brings them back here", () => {
    auth = { isAuthenticated: false, isLoading: false };
    render(<OrderHistory />);
    expect(screen.getByRole("link", { name: "Đăng nhập" })).toHaveAttribute(
      "href",
      "/login?next=%2Fmembership%2Forders",
    );
    expect(getMyMembershipOrders).not.toHaveBeenCalled();
  });

  it("lists each order with its plan, amount, note and how it stands", async () => {
    getMyMembershipOrders.mockResolvedValue([
      order({ id: "a", code: "PPAAAAAAAA", status: "PENDING" }),
      order({
        id: "b",
        code: "PPBBBBBBBB",
        plan: "YEAR",
        amount: 400000,
        status: "PAID",
        paidAt: "2026-11-03T03:00:00.000Z",
      }),
      order({ id: "c", code: "PPCCCCCCCC", status: "CANCELLED" }),
    ]);
    const { container } = render(<OrderHistory />);
    const waiting = (await screen.findByText("PPAAAAAAAA")).closest("tr")!;
    expect(within(waiting).getByText("Chờ xác nhận")).toBeInTheDocument();
    expect(
      within(waiting).getByRole("link", { name: "Xem mã QR" }),
    ).toHaveAttribute("href", "/membership");
    const paid = screen.getByText("PPBBBBBBBB").closest("tr")!;
    expect(within(paid).getByText("Đã thanh toán")).toBeInTheDocument();
    expect(within(paid).getByText("1 năm")).toBeInTheDocument();
    expect(within(paid).getByText("400.000 đ")).toBeInTheDocument();
    const cancelled = screen.getByText("PPCCCCCCCC").closest("tr")!;
    expect(within(cancelled).getByText("Đã huỷ")).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("says so when there are no orders", async () => {
    getMyMembershipOrders.mockResolvedValue([]);
    render(<OrderHistory />);
    expect(
      await screen.findByText("Bạn chưa có giao dịch nào."),
    ).toBeInTheDocument();
  });

  it("shows an error, not an empty list, when the history cannot be read", async () => {
    getMyMembershipOrders.mockRejectedValue(new Error("down"));
    render(<OrderHistory />);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Không tải được lịch sử giao dịch",
    );
    expect(
      screen.queryByText("Bạn chưa có giao dịch nào."),
    ).not.toBeInTheDocument();
  });
});
