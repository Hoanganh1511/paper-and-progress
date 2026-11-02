import { vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

let auth = { isAuthenticated: false, isLoading: false };
vi.mock("@/features/auth", () => ({ useAuth: () => auth }));

const getMyMembership = vi.hoisted(() => vi.fn());
vi.mock("@/features/membership", () => ({ getMyMembership }));

import { MembershipCard } from "./MembershipCard";

describe("MembershipCard", () => {
  beforeEach(() => {
    auth = { isAuthenticated: false, isLoading: false };
    getMyMembership.mockReset();
  });

  it("invites a guest to see the benefits, without a price and without asking the server", () => {
    render(<MembershipCard />);
    expect(
      screen.getByRole("heading", { name: "Baolingo Membership" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Khám phá quyền lợi" }),
    ).toHaveAttribute("href", "/membership");
    expect(screen.queryByText("Free")).not.toBeInTheDocument();
    expect(getMyMembership).not.toHaveBeenCalled();
  });

  it("marks a signed-in non-member as Free", async () => {
    auth = { isAuthenticated: true, isLoading: false };
    getMyMembership.mockResolvedValue({
      isMember: false,
      expiresAt: null,
      source: null,
    });
    render(<MembershipCard />);
    expect(await screen.findByText("Free")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Khám phá quyền lợi" }),
    ).toBeInTheDocument();
  });

  it("shows a member's badge and end date", async () => {
    auth = { isAuthenticated: true, isLoading: false };
    getMyMembership.mockResolvedValue({
      isMember: true,
      expiresAt: "2027-01-15T00:00:00.000Z",
      source: "PAYMENT",
    });
    render(<MembershipCard />);
    expect(await screen.findByText("Hội viên")).toBeInTheDocument();
    expect(screen.getByText(/Hết hạn ngày/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Xem hội viên" }),
    ).toBeInTheDocument();
  });

  it("asks an expired member to renew", async () => {
    auth = { isAuthenticated: true, isLoading: false };
    getMyMembership.mockResolvedValue({
      isMember: false,
      expiresAt: "2026-10-01T00:00:00.000Z",
      source: "PAYMENT",
    });
    render(<MembershipCard />);
    expect(await screen.findByText("Hết hạn")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Gia hạn hội viên" }),
    ).toHaveAttribute("href", "/membership");
  });

  it("stays a plain invitation, with no badge, when the status cannot be read", async () => {
    auth = { isAuthenticated: true, isLoading: false };
    getMyMembership.mockRejectedValue(new Error("down"));
    const { container } = render(<MembershipCard />);
    await vi.waitFor(() => expect(getMyMembership).toHaveBeenCalled());
    expect(screen.queryByText("Free")).not.toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});
