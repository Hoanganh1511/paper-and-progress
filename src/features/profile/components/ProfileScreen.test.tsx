import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { vi } from "vitest";
import { ProfileScreen } from "./ProfileScreen";

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

describe("ProfileScreen", () => {
  it("renders the title, the viewing tabs and the overview cards", () => {
    render(<ProfileScreen />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Hồ sơ cá nhân" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
      "Tổng quan",
      "Chuyên môn",
      "Hoạt động",
      "Nội dung & Dữ liệu",
    ]);
    expect(screen.getByRole("tab", { name: "Tổng quan" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("an@example.com")).toBeInTheDocument();
    for (const name of [
      "Thông tin nhanh",
      "Kỹ năng & Chuyên môn",
      "Chuỗi ngày học",
      "Tiến độ tuần này",
      "Hoạt động gần đây",
    ]) {
      expect(screen.getByRole("heading", { name })).toBeInTheDocument();
    }
  });

  it("keeps the editing tabs off this page", () => {
    render(<ProfileScreen />);
    for (const name of ["Chỉnh sửa", "Bảo mật", "Tùy chọn"]) {
      expect(screen.queryByRole("tab", { name })).toBeNull();
    }
  });

  it("shows the display name from the profile API", async () => {
    render(<ProfileScreen />);
    expect(await screen.findByText("An Nguyễn")).toBeInTheDocument();
  });

  it("links 'Chỉnh sửa hồ sơ' to the settings page", () => {
    render(<ProfileScreen />);
    expect(
      screen.getByRole("link", { name: "Chỉnh sửa hồ sơ" }),
    ).toHaveAttribute("href", "/settings");
  });

  it("shows the five hero stats once, and this week's numbers in the progress card", () => {
    render(<ProfileScreen />);
    const hero = screen.getByLabelText("Hồ sơ");
    for (const label of [
      "Dự án",
      "Nhật ký",
      "Bài viết",
      "Khóa học",
      "Điểm XP",
    ]) {
      expect(within(hero).getByText(label)).toBeInTheDocument();
    }
    const progress = screen
      .getByRole("heading", { name: "Tiến độ tuần này" })
      .closest("section")!;
    // None of the lifetime labels repeat in the weekly card.
    expect(within(progress).queryByText("Dự án")).toBeNull();
    expect(within(progress).queryByText("Điểm XP")).toBeNull();
    expect(within(progress).getByText("Buổi học")).toBeInTheDocument();
  });

  it("marks the streak days in words as well as colour", () => {
    render(<ProfileScreen />);
    const streak = screen
      .getByRole("heading", { name: "Chuỗi ngày học" })
      .closest("section")!;
    for (const text of ["đã học", "nghỉ", "hôm nay", "sắp tới"]) {
      expect(within(streak).getAllByText(text).length).toBeGreaterThan(0);
    }
  });

  it("lists recent activity as a timeline of links", () => {
    render(<ProfileScreen />);
    const activity = screen
      .getByRole("heading", { name: "Hoạt động gần đây" })
      .closest("section")!;
    expect(within(activity).getAllByRole("listitem")).toHaveLength(4);
    expect(
      within(activity).getByRole("link", { name: /Hoàn thành bài học/ }),
    ).toHaveAttribute("href", "/goals/tech/backend-tutor");
  });

  it("sends every edit action to the settings page", () => {
    render(<ProfileScreen />);
    for (const name of [
      "Chỉnh sửa hồ sơ",
      "Chỉnh sửa thông tin nhanh",
      "Chỉnh sửa kỹ năng",
      "Thêm kỹ năng",
    ]) {
      expect(screen.getByRole("link", { name })).toHaveAttribute(
        "href",
        "/settings",
      );
    }
  });

  it("switches to another tab", async () => {
    render(<ProfileScreen />);
    await userEvent.click(screen.getByRole("tab", { name: "Hoạt động" }));
    expect(
      screen.getByRole("heading", { level: 2, name: "Hoạt động" }),
    ).toBeVisible();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<ProfileScreen />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
