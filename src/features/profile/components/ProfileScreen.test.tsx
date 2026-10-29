import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { vi } from "vitest";
import { ProfileScreen } from "./ProfileScreen";

expect.extend(toHaveNoViolations);

vi.mock("@/features/auth", () => ({
  useAuth: () => ({
    user: { id: "1", email: "an@example.com", name: "Nguyễn An" },
  }),
}));

describe("ProfileScreen", () => {
  it("renders the title, nine tabs and the overview cards", () => {
    render(<ProfileScreen />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Hồ sơ cá nhân" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("tab")).toHaveLength(9);
    expect(screen.getByRole("tab", { name: "Tổng quan" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("Nguyễn An")).toBeInTheDocument();
    expect(screen.getByText("an@example.com")).toBeInTheDocument();
    for (const name of [
      "Thông tin nhanh",
      "Chuỗi ngày học",
      "Huy hiệu đạt được",
    ]) {
      expect(screen.getByRole("heading", { name })).toBeInTheDocument();
    }
  });

  it("switches to another tab", async () => {
    render(<ProfileScreen />);
    await userEvent.click(screen.getByRole("tab", { name: "Bảo mật" }));
    expect(
      screen.getByRole("heading", { level: 2, name: "Bảo mật" }),
    ).toBeVisible();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<ProfileScreen />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
