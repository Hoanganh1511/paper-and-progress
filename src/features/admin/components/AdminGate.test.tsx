import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

const replace = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

let user: { role?: string } | null = null;
vi.mock("@/features/auth", () => ({ useAuth: () => ({ user }) }));

import { AdminGate } from "./AdminGate";

beforeEach(() => replace.mockClear());

describe("AdminGate", () => {
  it("shows the admin area to an ADMIN", () => {
    user = { role: "ADMIN" };
    render(<AdminGate>secret</AdminGate>);
    expect(screen.getByText("secret")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it.each([["USER"], ["CREATOR"], [undefined]])(
    "sends a %s home and shows nothing",
    (role) => {
      user = { role };
      render(<AdminGate>secret</AdminGate>);
      expect(screen.queryByText("secret")).toBeNull();
      expect(replace).toHaveBeenCalledWith("/");
    },
  );

  it("waits while there is no user yet", () => {
    user = null;
    render(<AdminGate>secret</AdminGate>);
    expect(screen.queryByText("secret")).toBeNull();
    expect(replace).not.toHaveBeenCalled();
  });
});
