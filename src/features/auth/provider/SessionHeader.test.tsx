import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn() }),
}));

const auth = vi.hoisted(() => ({
  current: {
    user: { id: "1", email: "a@b.co", name: "An", role: "USER" } as {
      id: string;
      email: string;
      name: string;
      role?: string;
    } | null,
    isAuthenticated: true,
    logout: vi.fn(),
  },
}));
vi.mock("../hooks", () => ({ useAuth: () => auth.current }));

import { SessionHeader } from "./SessionHeader";

function signIn(role?: string) {
  auth.current = {
    ...auth.current,
    isAuthenticated: true,
    user: { id: "1", email: "a@b.co", name: "An", role },
  };
}

describe("SessionHeader: Project Status and Quản trị", () => {
  it("shows Project Status to an admin, leading to the project dashboard", async () => {
    signIn("ADMIN");
    render(<SessionHeader />);
    expect(
      screen.getByRole("link", { name: "Project Status" }),
    ).toHaveAttribute("href", "/dashboard");
    await userEvent.click(screen.getByRole("button", { name: /Hồ sơ/ }));
    expect(
      screen.getByRole("menuitem", { name: "Quản trị" }),
    ).toBeInTheDocument();
  });

  it.each([["USER"], ["CREATOR"], [undefined]])(
    "hides Project Status and Quản trị from a %s",
    async (role) => {
      signIn(role);
      render(<SessionHeader />);
      expect(
        screen.queryByRole("link", { name: "Project Status" }),
      ).not.toBeInTheDocument();
      await userEvent.click(screen.getByRole("button", { name: /Hồ sơ/ }));
      expect(
        screen.queryByRole("menuitem", { name: "Quản trị" }),
      ).not.toBeInTheDocument();
    },
  );

  it("hides Project Status from a signed-out visitor", () => {
    auth.current = { ...auth.current, isAuthenticated: false, user: null };
    render(<SessionHeader />);
    expect(
      screen.queryByRole("link", { name: "Project Status" }),
    ).not.toBeInTheDocument();
  });
});
