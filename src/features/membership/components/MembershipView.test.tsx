import { vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

vi.mock("next/navigation", () => ({ usePathname: () => "/membership" }));

let auth = { isAuthenticated: false, isLoading: false };
vi.mock("@/features/auth", () => ({
  useAuth: () => auth,
  loginHref: (path: string) => `/login?next=${encodeURIComponent(path)}`,
}));

const api = vi.hoisted(() => ({
  getMyMembership: vi.fn(),
  getMembershipPlans: vi.fn(),
  getMyMembershipOrders: vi.fn(),
  createMembershipOrder: vi.fn(),
  cancelMyMembershipOrder: vi.fn(),
}));
vi.mock("../membershipApi", () => api);

const events = vi.hoisted(() => ({
  isEnabled: false,
  onChange: undefined as (() => void) | undefined,
}));
vi.mock("../useMembershipEvents", () => ({
  useMembershipEvents: (isEnabled: boolean, onChange: () => void) => {
    events.isEnabled = isEnabled;
    events.onChange = onChange;
  },
}));

import { MembershipView } from "./MembershipView";

const open = {
  isOpen: true,
  plans: [
    { plan: "MONTH", label: "1 tháng", months: 1, amount: 50000 },
    { plan: "YEAR", label: "1 năm", months: 12, amount: 500000 },
  ],
};

const waiting = {
  id: "o1",
  plan: "MONTH",
  months: 1,
  amount: 50000,
  code: "PPABCDEFGH",
  status: "PENDING",
  createdAt: "2026-11-02T00:00:00.000Z",
  paidAt: null,
  payment: {
    bankBin: "970422",
    accountNo: "0123456789",
    accountName: "NGUYEN VAN A",
    qrUrl: "https://img.vietqr.io/image/970422-0123456789-compact2.png",
  },
};

const notMember = { isMember: false, expiresAt: null, source: null };

function signIn(options: {
  status?: object;
  plans?: object;
  orders?: object[];
}) {
  auth = { isAuthenticated: true, isLoading: false };
  api.getMyMembership.mockResolvedValue(options.status ?? notMember);
  api.getMembershipPlans.mockResolvedValue(options.plans ?? open);
  api.getMyMembershipOrders.mockResolvedValue(options.orders ?? []);
}

describe("MembershipView", () => {
  beforeEach(() => {
    auth = { isAuthenticated: false, isLoading: false };
    Object.values(api).forEach((fn) => fn.mockReset());
  });

  it("lists what membership gives", () => {
    render(<MembershipView />);
    expect(
      screen.getByRole("heading", { name: "Quyền lợi hội viên" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/xem trước 30%/)).toBeInTheDocument();
  });

  it("asks a guest to sign in and brings them back here", () => {
    render(<MembershipView />);
    expect(screen.getByRole("link", { name: "Đăng nhập" })).toHaveAttribute(
      "href",
      "/login?next=%2Fmembership",
    );
    expect(api.getMyMembership).not.toHaveBeenCalled();
  });

  it("tells a member when it ends and offers to extend", async () => {
    signIn({
      status: {
        isMember: true,
        expiresAt: "2027-01-15T00:00:00.000Z",
        source: "PAYMENT",
      },
    });
    render(<MembershipView />);
    expect(await screen.findByText("Bạn là hội viên")).toBeInTheDocument();
    expect(screen.getByText(/Hết hạn ngày/)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Gia hạn hội viên" }),
    ).toBeInTheDocument();
  });

  it("shows the plans and prices to a non-member", async () => {
    signIn({});
    render(<MembershipView />);
    expect(await screen.findByText("Bạn chưa là hội viên")).toBeInTheDocument();
    expect(screen.getByText("50.000 đ")).toBeInTheDocument();
    expect(screen.getByText("500.000 đ")).toBeInTheDocument();
  });

  it("says sign-up is closed while the owner has not set payment up", async () => {
    signIn({ plans: { isOpen: false, plans: [] } });
    render(<MembershipView />);
    expect(
      await screen.findByText(/Đăng ký hội viên chưa mở/),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Chọn gói/ }),
    ).not.toBeInTheDocument();
  });

  it("opens an order and shows the QR with the amount and note to type in", async () => {
    signIn({});
    api.createMembershipOrder.mockResolvedValue(waiting);
    render(<MembershipView />);
    const choose = await screen.findByRole("button", {
      name: "Chọn gói 1 tháng",
    });
    api.getMyMembershipOrders.mockResolvedValue([waiting]);
    await userEvent.click(choose);
    expect(api.createMembershipOrder).toHaveBeenCalledWith("MONTH");
    expect(
      await screen.findByRole("img", { name: /nội dung PPABCDEFGH/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("PPABCDEFGH")).toBeInTheDocument();
    expect(screen.getByText("0123456789")).toBeInTheDocument();
  });

  it("tells the reader, with the time, that nothing is confirmed yet after a check", async () => {
    signIn({ orders: [waiting] });
    render(<MembershipView />);
    await userEvent.click(
      await screen.findByRole("button", {
        name: "Tôi đã chuyển, kiểm tra lại",
      }),
    );
    expect(
      await screen.findByText(/chưa thấy xác nhận thanh toán/),
    ).toBeInTheDocument();
    expect(api.getMyMembershipOrders).toHaveBeenCalledTimes(2);
    // The order is still there: nothing was lost by checking.
    expect(
      screen.getByRole("heading", { name: "Chuyển khoản để hoàn tất" }),
    ).toBeInTheDocument();
  });

  it("welcomes the reader when the order was confirmed in the meantime", async () => {
    signIn({ orders: [waiting] });
    render(<MembershipView />);
    const check = await screen.findByRole("button", {
      name: "Tôi đã chuyển, kiểm tra lại",
    });
    api.getMyMembership.mockResolvedValue({
      isMember: true,
      expiresAt: "2026-12-02T00:00:00.000Z",
      source: "PAYMENT",
    });
    api.getMyMembershipOrders.mockResolvedValue([
      { ...waiting, status: "PAID", payment: null },
    ]);
    await userEvent.click(check);
    expect(await screen.findByText(/Đã nhận được tiền/)).toBeInTheDocument();
    expect(await screen.findByText("Bạn là hội viên")).toBeInTheDocument();
  });

  it("listens for the server only while an order is waiting", async () => {
    signIn({});
    render(<MembershipView />);
    await screen.findByText("Bạn chưa là hội viên");
    expect(events.isEnabled).toBe(false);
    cleanup();
    signIn({ orders: [waiting] });
    render(<MembershipView />);
    await screen.findByRole("heading", { name: "Chuyển khoản để hoàn tất" });
    expect(events.isEnabled).toBe(true);
  });

  it("welcomes the reader at once when the server says the money arrived", async () => {
    signIn({ orders: [waiting] });
    render(<MembershipView />);
    await screen.findByRole("heading", { name: "Chuyển khoản để hoàn tất" });
    api.getMyMembership.mockResolvedValue({
      isMember: true,
      expiresAt: "2026-12-02T00:00:00.000Z",
      source: "PAYMENT",
    });
    api.getMyMembershipOrders.mockResolvedValue([
      { ...waiting, status: "PAID", payment: null },
    ]);
    await act(async () => events.onChange?.());
    expect(await screen.findByText(/Đã nhận được tiền/)).toBeInTheDocument();
    expect(screen.getByText("Bạn là hội viên")).toBeInTheDocument();
  });

  it("links to the order history", async () => {
    signIn({});
    render(<MembershipView />);
    expect(
      await screen.findByRole("link", { name: "Lịch sử giao dịch" }),
    ).toHaveAttribute("href", "/membership/orders");
  });

  it("shows the waiting order again after a reload", async () => {
    signIn({ orders: [waiting] });
    render(<MembershipView />);
    expect(
      await screen.findByRole("heading", { name: "Chuyển khoản để hoàn tất" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Chọn gói/ }),
    ).not.toBeInTheDocument();
  });

  it("cancels the waiting order", async () => {
    signIn({ orders: [waiting] });
    api.cancelMyMembershipOrder.mockResolvedValue(undefined);
    render(<MembershipView />);
    api.getMyMembershipOrders.mockResolvedValue([]);
    await userEvent.click(
      await screen.findByRole("button", { name: "Huỷ đơn" }),
    );
    expect(api.cancelMyMembershipOrder).toHaveBeenCalledWith("o1");
    expect(
      await screen.findByRole("heading", { name: "Chọn gói" }),
    ).toBeInTheDocument();
  });

  it("shows why an order could not be opened", async () => {
    signIn({});
    api.createMembershipOrder.mockRejectedValue(new Error("Quá nhiều đơn"));
    render(<MembershipView />);
    await userEvent.click(
      await screen.findByRole("button", { name: "Chọn gói 1 năm" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent("Quá nhiều đơn");
  });

  it("shows an error, not a made-up status, when the status cannot be read", async () => {
    auth = { isAuthenticated: true, isLoading: false };
    api.getMyMembership.mockRejectedValue(new Error("down"));
    api.getMembershipPlans.mockResolvedValue(open);
    api.getMyMembershipOrders.mockResolvedValue([]);
    render(<MembershipView />);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Không tải được trạng thái hội viên",
    );
    expect(screen.queryByText("Bạn chưa là hội viên")).not.toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    signIn({ orders: [waiting] });
    const { container } = render(<MembershipView />);
    await screen.findByRole("heading", { name: "Chuyển khoản để hoàn tất" });
    expect(await axe(container)).toHaveNoViolations();
  });
});
