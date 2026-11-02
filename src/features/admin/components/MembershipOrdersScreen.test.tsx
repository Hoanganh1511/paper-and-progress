import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { vi } from "vitest";

expect.extend(toHaveNoViolations);

const api = vi.hoisted(() => ({
  listAdminMembershipOrders: vi.fn(),
  confirmAdminMembershipOrder: vi.fn(),
  cancelAdminMembershipOrder: vi.fn(),
}));
vi.mock("../adminApi", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../adminApi")>()),
  ...api,
}));

import { MembershipOrdersScreen } from "./MembershipOrdersScreen";

const order = {
  id: "o1",
  plan: "MONTH",
  amount: 50000,
  code: "PPABCDEFGH",
  status: "PENDING",
  createdAt: "2026-11-02T03:00:00.000Z",
  paidAt: null,
  user: { id: "u1", email: "an@example.com", displayName: "An" },
};

describe("MembershipOrdersScreen", () => {
  beforeEach(() => {
    Object.values(api).forEach((fn) => fn.mockReset());
    api.listAdminMembershipOrders.mockResolvedValue([order]);
  });

  it("lists the orders waiting for money with amount and transfer note", async () => {
    render(<MembershipOrdersScreen />);
    expect(await screen.findByText("PPABCDEFGH")).toBeInTheDocument();
    expect(screen.getByText("An")).toBeInTheDocument();
    expect(screen.getByText("50.000 đ")).toBeInTheDocument();
    expect(api.listAdminMembershipOrders).toHaveBeenCalledWith("PENDING");
  });

  it("confirms an order and reads the list again", async () => {
    api.confirmAdminMembershipOrder.mockResolvedValue({
      ok: true,
      alreadyPaid: false,
    });
    render(<MembershipOrdersScreen />);
    await userEvent.click(
      await screen.findByRole("button", {
        name: "Đã nhận tiền, đơn PPABCDEFGH",
      }),
    );
    expect(api.confirmAdminMembershipOrder).toHaveBeenCalledWith("o1");
    await vi.waitFor(() =>
      expect(api.listAdminMembershipOrders).toHaveBeenCalledTimes(2),
    );
  });

  it("cancels an order", async () => {
    api.cancelAdminMembershipOrder.mockResolvedValue({ ok: true });
    render(<MembershipOrdersScreen />);
    await userEvent.click(
      await screen.findByRole("button", { name: "Huỷ đơn PPABCDEFGH" }),
    );
    expect(api.cancelAdminMembershipOrder).toHaveBeenCalledWith("o1");
  });

  it("shows why a confirm failed", async () => {
    api.confirmAdminMembershipOrder.mockRejectedValue(new Error("Đơn đã huỷ"));
    render(<MembershipOrdersScreen />);
    await userEvent.click(
      await screen.findByRole("button", {
        name: "Đã nhận tiền, đơn PPABCDEFGH",
      }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent("Đơn đã huỷ");
  });

  it("says when there is nothing to confirm", async () => {
    api.listAdminMembershipOrders.mockResolvedValue([]);
    render(<MembershipOrdersScreen />);
    expect(await screen.findByText("Không có đơn nào.")).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = render(<MembershipOrdersScreen />);
    await screen.findByText("PPABCDEFGH");
    expect(await axe(container)).toHaveNoViolations();
  });
});
