import { vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

let auth = { isAuthenticated: false, isLoading: false };
vi.mock("@/features/auth", () => ({ useAuth: () => auth }));

const getMyMembership = vi.hoisted(() => vi.fn());
vi.mock("./membershipApi", () => ({ getMyMembership }));

import { useIsMember } from "./useIsMember";

describe("useIsMember", () => {
  beforeEach(() => {
    auth = { isAuthenticated: false, isLoading: false };
    getMyMembership.mockReset();
  });

  it("is false for a guest, without asking the server", () => {
    const { result } = renderHook(() => useIsMember());
    expect(result.current).toBe(false);
    expect(getMyMembership).not.toHaveBeenCalled();
  });

  it("is unknown while the session is being restored", () => {
    auth = { isAuthenticated: false, isLoading: true };
    const { result } = renderHook(() => useIsMember());
    expect(result.current).toBeUndefined();
  });

  it("is unknown until the server answers, then true for a member", async () => {
    auth = { isAuthenticated: true, isLoading: false };
    getMyMembership.mockResolvedValue({
      isMember: true,
      expiresAt: "2027-01-01T00:00:00.000Z",
      source: "PAYMENT",
    });
    const { result } = renderHook(() => useIsMember());
    expect(result.current).toBeUndefined();
    await waitFor(() => expect(result.current).toBe(true));
  });

  it("is false for a signed-in reader who is not a member", async () => {
    auth = { isAuthenticated: true, isLoading: false };
    getMyMembership.mockResolvedValue({
      isMember: false,
      expiresAt: null,
      source: null,
    });
    const { result } = renderHook(() => useIsMember());
    await waitFor(() => expect(result.current).toBe(false));
  });

  it("stays unknown, not false, when the status cannot be read", async () => {
    auth = { isAuthenticated: true, isLoading: false };
    getMyMembership.mockRejectedValue(new Error("down"));
    const { result } = renderHook(() => useIsMember());
    await waitFor(() => expect(getMyMembership).toHaveBeenCalled());
    expect(result.current).toBeUndefined();
  });
});
