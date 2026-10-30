import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { vi } from "vitest";
import { SettingsScreen } from "./SettingsScreen";

expect.extend(toHaveNoViolations);

const profileApi = vi.hoisted(() => ({
  getProfile: vi.fn(),
}));
vi.mock("../profileApi", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../profileApi")>()),
  ...profileApi,
}));

vi.mock("@/features/auth", () => ({
  useAuth: () => ({
    user: { id: "1", email: "an@example.com", name: "Nguyễn An" },
    logout: vi.fn(),
  }),
}));

beforeEach(() => {
  profileApi.getProfile.mockResolvedValue({
    email: "an@example.com",
    displayName: "An Nguyễn",
    bio: null,
    phone: null,
    avatarUrl: null,
    timezone: "Asia/Ho_Chi_Minh",
    locale: "vi",
    theme: "system",
  });
});

describe("SettingsScreen", () => {
  it("renders the title and the five settings tabs, starting on the edit tab", async () => {
    render(<SettingsScreen />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Cài đặt tài khoản" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
      "Tài khoản",
      "Bảo mật & Quyền",
      "Tùy chọn",
      "Tài khoản liên kết",
      "Gói & Thanh toán",
    ]);
    expect(screen.getByRole("tab", { name: "Tài khoản" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(
      await screen.findByRole("heading", { level: 2, name: "Tài khoản" }),
    ).toBeVisible();
  });

  it("links back to the profile page", () => {
    render(<SettingsScreen />);
    expect(screen.getByRole("link", { name: "Xem hồ sơ" })).toHaveAttribute(
      "href",
      "/profile",
    );
  });

  it("offers a retry when the profile fails to load", async () => {
    profileApi.getProfile.mockRejectedValueOnce(new Error("down"));
    render(<SettingsScreen />);
    const panel = screen.getByRole("tabpanel");
    expect(
      await within(panel).findByText("Không tải được hồ sơ của bạn."),
    ).toBeInTheDocument();
    await userEvent.click(
      within(panel).getByRole("button", { name: "Thử lại" }),
    );
    expect(
      await screen.findByRole("heading", { level: 2, name: "Tài khoản" }),
    ).toBeInTheDocument();
  });

  it("switches to the security tab", async () => {
    render(<SettingsScreen />);
    await userEvent.click(screen.getByRole("tab", { name: "Bảo mật & Quyền" }));
    expect(
      screen.getByRole("heading", { level: 2, name: "Bảo mật & Quyền" }),
    ).toBeVisible();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<SettingsScreen />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
