import { render, screen, within } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { vi } from "vitest";

expect.extend(toHaveNoViolations);

vi.mock("../totpApi", () => ({
  getTotpEnabled: () => new Promise(() => {}),
}));

import { SecurityTab } from "./SecurityTab";

describe("security overview", () => {
  it("lists the alerts and the security checkup, linking 2-step to its card", () => {
    render(<SecurityTab />);
    const checkup = screen.getByRole("list", { name: "Kiểm tra bảo mật" });
    expect(
      within(checkup)
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual([
      "Điện thoạiDự kiến ra mắt",
      "Xác minh 2 bước",
      "EmailDự kiến ra mắt",
      "Thiết bị của bạnDự kiến ra mắt",
      "Hoạt động bảo mậtDự kiến ra mắt",
    ]);
    expect(
      screen.getByRole("link", { name: "Xác minh 2 bước" }),
    ).toHaveAttribute("href", "#two-factor");
    expect(
      screen.getByRole("list", { name: "Cảnh báo bảo mật" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Dự kiến ra mắt")).toHaveLength(8);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<SecurityTab />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
