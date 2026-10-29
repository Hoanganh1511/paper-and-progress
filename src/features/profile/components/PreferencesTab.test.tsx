import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { vi } from "vitest";
import { ProfileApiError, type UserProfile } from "../profileApi";
import { PreferencesTab } from "./PreferencesTab";

expect.extend(toHaveNoViolations);

const profile: UserProfile = {
  email: "an@example.com",
  displayName: null,
  bio: null,
  phone: null,
  avatarUrl: null,
  timezone: "Asia/Ho_Chi_Minh",
  locale: "vi",
  theme: "system",
};

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.classList.remove("dark");
  delete document.documentElement.dataset.theme;
});

function setup() {
  const onSave = vi.fn().mockResolvedValue(undefined);
  render(<PreferencesTab profile={profile} onSave={onSave} />);
  return onSave;
}

describe("ThemeSelector", () => {
  it("starts on the system option when nothing was chosen", () => {
    setup();
    expect(
      screen.getByRole("button", { name: "Theo hệ thống" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("applies the theme at once and saves it to the account", async () => {
    const onSave = setup();
    await userEvent.click(screen.getByRole("button", { name: "Tối" }));
    expect(document.documentElement).toHaveClass("dark");
    expect(onSave).toHaveBeenCalledWith({ theme: "dark" });
    expect(await screen.findByText("Đã lưu giao diện.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tối" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("the system option forgets the saved choice and sends system", async () => {
    const onSave = setup();
    await userEvent.click(screen.getByRole("button", { name: "Sáng" }));
    expect(window.localStorage.getItem("theme")).toBe("light");

    await userEvent.click(
      await screen.findByRole("button", { name: "Theo hệ thống" }),
    );
    expect(window.localStorage.getItem("theme")).toBeNull();
    expect(document.documentElement.dataset.theme).toBeUndefined();
    expect(onSave).toHaveBeenLastCalledWith({ theme: "system" });
  });

  it("keeps the local choice but reports a failed save", async () => {
    const onSave = setup();
    onSave.mockRejectedValueOnce(new ProfileApiError("Lỗi từ máy chủ", 400));
    await userEvent.click(screen.getByRole("button", { name: "Tối" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Lỗi từ máy chủ",
    );
    expect(document.documentElement).toHaveClass("dark");
  });
});

describe("LocaleSelector", () => {
  it("shows the saved language and saves a new one", async () => {
    const onSave = setup();
    expect(screen.getByRole("button", { name: "Tiếng Việt" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await userEvent.click(screen.getByRole("button", { name: "English" }));
    expect(onSave).toHaveBeenCalledWith({ locale: "en" });
    expect(await screen.findByText("Đã lưu ngôn ngữ.")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <PreferencesTab profile={profile} onSave={vi.fn()} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
