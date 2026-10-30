import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { vi } from "vitest";

expect.extend(toHaveNoViolations);

const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/admin/users",
}));

// ResponsiveContainer needs a measured parent, which jsdom does not have.
vi.mock("recharts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("recharts")>();
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactElement }) => (
      <div style={{ width: 400, height: 200 }}>{children}</div>
    ),
  };
});

const api = vi.hoisted(() => ({
  getAdminStats: vi.fn(),
  listAdminUsers: vi.fn(),
  getAdminUser: vi.fn(),
  listAdminLoginHistory: vi.fn(),
  listAdminSecurityEvents: vi.fn(),
}));
vi.mock("../adminApi", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../adminApi")>()),
  ...api,
}));

import { AdminShell } from "./AdminShell";
import { LoginHistoryScreen } from "./LoginHistoryScreen";
import { OverviewScreen } from "./OverviewScreen";
import { SecurityEventsScreen } from "./SecurityEventsScreen";
import { UserDetailScreen } from "./UserDetailScreen";
import { UsersScreen } from "./UsersScreen";

const user = {
  id: "u1",
  email: "an@example.com",
  displayName: "An",
  role: "USER",
  isActive: true,
  createdAt: "2026-10-01T03:00:00.000Z",
  totpEnabled: true,
  providers: ["local", "google"],
  lastLoginAt: "2026-10-29T03:00:00.000Z",
};

const login = (id: string, ip: string, isNewIp: boolean) => ({
  id,
  userId: "u1",
  ip,
  userAgent: "Mozilla/5.0",
  createdAt: "2026-10-29T03:00:00.000Z",
  user: { id: "u1", email: "an@example.com" },
  isNewIp,
});

beforeEach(() => {
  vi.clearAllMocks();
  api.getAdminStats.mockResolvedValue({
    users: { total: 80, newToday: 1, newThisWeek: 5 },
    logins: { today: 12, thisWeek: 70 },
    loginsByDay: Array.from({ length: 7 }, (_, i) => ({
      date: `2026-10-${String(24 + i).padStart(2, "0")}`,
      count: i,
    })),
    twoFactor: { enabled: 20, disabled: 60 },
    securityEventsLast7Days: { TOTP_FAIL: 3, RECAPTCHA_REJECT: 1 },
  });
  api.listAdminUsers.mockResolvedValue({
    items: [user],
    total: 45,
    page: 1,
    limit: 20,
  });
  api.getAdminUser.mockResolvedValue({
    ...user,
    avatarUrl: null,
    updatedAt: user.createdAt,
    totpEnabledAt: user.createdAt,
  });
  api.listAdminLoginHistory.mockResolvedValue({
    items: [login("l1", "1.1.1.1", false), login("l2", "9.9.9.9", true)],
    total: 2,
    page: 1,
    limit: 20,
  });
  api.listAdminSecurityEvents.mockResolvedValue({
    items: [
      {
        id: "e1",
        type: "TOTP_FAIL",
        userId: "u1",
        ip: "1.1.1.1",
        metadata: { attempts: 3 },
        createdAt: "2026-10-29T03:00:00.000Z",
        user: { id: "u1", email: "an@example.com" },
      },
    ],
    total: 1,
    page: 1,
    limit: 20,
  });
});

describe("AdminShell", () => {
  it("lists the four sections and marks the current one", () => {
    render(<AdminShell>body</AdminShell>);
    const nav = screen.getByRole("navigation", { name: "Admin" });
    expect(
      within(nav)
        .getAllByRole("link")
        .map((link) => link.textContent),
    ).toEqual(["Overview", "Users", "Login History", "Security Events"]);
    expect(within(nav).getByRole("link", { name: "Users" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});

describe("OverviewScreen", () => {
  it("shows the four stats, both charts and the recent events", async () => {
    const { container } = render(<OverviewScreen />);
    expect(await screen.findByText("80")).toBeInTheDocument();
    expect(screen.getByText("25%")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getAllByRole("img")).toHaveLength(2);
    expect(await screen.findByText("TOTP_FAIL")).toBeInTheDocument();
    expect(api.listAdminSecurityEvents).toHaveBeenCalledWith({
      page: 1,
      limit: 5,
    });
    expect(await axe(container)).toHaveNoViolations();
  });

  it("offers a retry when the stats fail", async () => {
    api.getAdminStats.mockRejectedValueOnce(new Error("Boom"));
    render(<OverviewScreen />);
    expect(await screen.findByText("Boom")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(await screen.findByText("80")).toBeInTheDocument();
  });
});

describe("UsersScreen", () => {
  it("lists users, searches by email and pages", async () => {
    const { container } = render(<UsersScreen />);
    expect(await screen.findByText("an@example.com")).toBeInTheDocument();
    expect(screen.getByText("Google")).toBeInTheDocument();
    expect(screen.getByText("ON")).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();

    await userEvent.type(screen.getByLabelText("Tìm theo email"), "an@");
    await waitFor(() =>
      expect(api.listAdminUsers).toHaveBeenLastCalledWith({
        page: 1,
        limit: 20,
        search: "an@",
      }),
    );

    await userEvent.click(screen.getByRole("button", { name: "Trang sau" }));
    await waitFor(() =>
      expect(api.listAdminUsers).toHaveBeenLastCalledWith({
        page: 2,
        limit: 20,
        search: "an@",
      }),
    );
  });

  it("opens the detail page of a user when the row is clicked", async () => {
    render(<UsersScreen />);
    await userEvent.click(await screen.findByText("ON"));
    expect(push).toHaveBeenCalledWith("/admin/users/detail?id=u1");
  });
});

describe("empty and loading rows", () => {
  it("centre their message across the whole table", async () => {
    api.listAdminSecurityEvents.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 20,
    });
    render(<SecurityEventsScreen />);
    const cell = await screen.findByText("Không có sự kiện nào.");
    expect(cell).toHaveClass("text-center");
    expect(cell).toHaveAttribute("colspan", "5");
  });
});

describe("UserDetailScreen", () => {
  it("shows the account and its own login history", async () => {
    render(<UserDetailScreen userId="u1" />);
    expect(
      await screen.findByRole("heading", { level: 1, name: "an@example.com" }),
    ).toBeInTheDocument();
    expect(await screen.findByText("9.9.9.9")).toBeInTheDocument();
    expect(screen.getByText("ON")).toBeInTheDocument();
    expect(api.listAdminLoginHistory).toHaveBeenCalledWith({
      userId: "u1",
      page: 1,
      limit: 20,
    });
  });
});

describe("LoginHistoryScreen", () => {
  it("badges only the IP the user had not used before", async () => {
    const { container } = render(<LoginHistoryScreen />);
    expect(await screen.findByText("9.9.9.9")).toBeInTheDocument();
    expect(screen.getAllByText("IP mới")).toHaveLength(1);
    const newRow = screen.getByText("9.9.9.9").closest("tr");
    expect(within(newRow as HTMLElement).getByText("IP mới")).toBeVisible();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("sends the search and the date range, from the start to the end of the day", async () => {
    render(<LoginHistoryScreen />);
    await screen.findByText("9.9.9.9");
    await userEvent.type(
      screen.getByLabelText("Tìm theo email hoặc IP"),
      "9.9",
    );
    // The calendar opens on this month; pick the 1st and the 2nd.
    const now = new Date();
    const month = `${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
    await userEvent.click(screen.getByRole("button", { name: /Từ ngày/ }));
    await userEvent.click(screen.getByRole("button", { name: `01/${month}` }));
    await userEvent.click(screen.getByRole("button", { name: /Đến ngày/ }));
    await userEvent.click(screen.getByRole("button", { name: `02/${month}` }));
    await waitFor(() => {
      const last = api.listAdminLoginHistory.mock.lastCall?.[0];
      expect(last).toMatchObject({ page: 1, search: "9.9" });
      expect(new Date(last.from).getHours()).toBe(0);
      expect(new Date(last.to).getHours()).toBe(23);
    });
  });
});

describe("SecurityEventsScreen", () => {
  it("shows the type badge and the metadata", async () => {
    const { container } = render(<SecurityEventsScreen />);
    expect(await screen.findByText("TOTP_FAIL")).toBeInTheDocument();
    expect(screen.getByText('{"attempts":3}')).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("filters by type", async () => {
    render(<SecurityEventsScreen />);
    await screen.findByText("TOTP_FAIL");
    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.click(
      await screen.findByRole("option", { name: /RECAPTCHA_REJECT/ }),
    );
    await waitFor(() =>
      expect(api.listAdminSecurityEvents).toHaveBeenLastCalledWith(
        expect.objectContaining({ type: "RECAPTCHA_REJECT", page: 1 }),
      ),
    );
  });
});
