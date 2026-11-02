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

const membershipApi = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("../authApi", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../authApi")>()),
  api: membershipApi,
}));

import { SessionHeader } from "./SessionHeader";

function signIn(role?: string) {
  auth.current = {
    ...auth.current,
    isAuthenticated: true,
    user: { id: "1", email: "a@b.co", name: "An", role },
  };
}

describe("SessionHeader: membership in the account menu", () => {
  beforeEach(() => {
    membershipApi.get.mockReset();
    signIn("USER");
  });

  async function openMenu() {
    render(<SessionHeader />);
    await userEvent.click(screen.getByRole("button", { name: /Hồ sơ/ }));
  }

  it("says Free and offers an upgrade to a non-member", async () => {
    membershipApi.get.mockResolvedValue({
      data: { isMember: false, expiresAt: null },
    });
    await openMenu();
    expect(await screen.findByText("Thành viên miễn phí")).toBeInTheDocument();
    expect(screen.getByText("Nâng cấp")).toBeInTheDocument();
  });

  it("says when a member's membership ends, with no upgrade badge", async () => {
    membershipApi.get.mockResolvedValue({
      data: { isMember: true, expiresAt: "2027-01-15T00:00:00.000Z" },
    });
    await openMenu();
    expect(await screen.findByText(/Hội viên đến/)).toBeInTheDocument();
    expect(screen.queryByText("Nâng cấp")).not.toBeInTheDocument();
  });

  it("puts the crown on the avatar of a member, not of anyone else", async () => {
    membershipApi.get.mockResolvedValue({
      data: { isMember: true, expiresAt: "2027-01-15T00:00:00.000Z" },
    });
    const member = render(<SessionHeader />);
    expect(await screen.findByTestId("member-crown")).toBeInTheDocument();
    member.unmount();
    membershipApi.get.mockResolvedValue({
      data: { isMember: false, expiresAt: "2026-10-01T00:00:00.000Z" },
    });
    render(<SessionHeader />);
    await vi.waitFor(() => expect(membershipApi.get).toHaveBeenCalledTimes(2));
    expect(screen.queryByTestId("member-crown")).not.toBeInTheDocument();
  });

  it("offers to renew an expired membership", async () => {
    membershipApi.get.mockResolvedValue({
      data: { isMember: false, expiresAt: "2026-10-01T00:00:00.000Z" },
    });
    await openMenu();
    expect(await screen.findByText("Hội viên đã hết hạn")).toBeInTheDocument();
    expect(screen.getByText("Gia hạn")).toBeInTheDocument();
  });

  it("shows the email, and no claim, while the status is unknown", async () => {
    membershipApi.get.mockRejectedValue(new Error("down"));
    await openMenu();
    expect(screen.getByText("a@b.co")).toBeInTheDocument();
    expect(screen.queryByText("Nâng cấp")).not.toBeInTheDocument();
  });
});

describe("SessionHeader: Project Status and Quản trị", () => {
  beforeEach(() => {
    membershipApi.get.mockResolvedValue({
      data: { isMember: false, expiresAt: null },
    });
  });

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

describe("SessionHeader: articles", () => {
  it("has no Bài viết button of its own: articles are reached through the knowledge library", () => {
    auth.current = { ...auth.current, isAuthenticated: false, user: null };
    const { unmount } = render(<SessionHeader />);
    expect(
      screen.queryByRole("link", { name: "Bài viết" }),
    ).not.toBeInTheDocument();
    unmount();
    signIn("USER");
    render(<SessionHeader />);
    expect(
      screen.queryByRole("link", { name: "Bài viết" }),
    ).not.toBeInTheDocument();
  });

  it("gives every signed-in user their saved articles in the account menu", async () => {
    signIn("USER");
    render(<SessionHeader />);
    await userEvent.click(screen.getByRole("button", { name: /Hồ sơ/ }));
    expect(
      screen.getByRole("menuitem", { name: "Bài viết đã lưu" }),
    ).toBeInTheDocument();
  });

  it.each([["CREATOR"], ["ADMIN"]])("offers Viết bài to a %s", async (role) => {
    signIn(role);
    render(<SessionHeader />);
    await userEvent.click(screen.getByRole("button", { name: /Hồ sơ/ }));
    expect(
      screen.getByRole("menuitem", { name: "Viết bài" }),
    ).toBeInTheDocument();
  });

  it.each([["USER"], [undefined]])(
    "does not offer Viết bài to a %s",
    async (role) => {
      signIn(role);
      render(<SessionHeader />);
      await userEvent.click(screen.getByRole("button", { name: /Hồ sơ/ }));
      expect(
        screen.queryByRole("menuitem", { name: "Viết bài" }),
      ).not.toBeInTheDocument();
    },
  );
});
