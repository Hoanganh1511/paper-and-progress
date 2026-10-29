import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { vi } from "vitest";

expect.extend(toHaveNoViolations);

const api = vi.hoisted(() => ({
  changePassword: vi.fn(),
  deleteAccount: vi.fn(),
}));
vi.mock("../profileApi", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../profileApi")>()),
  ...api,
}));

const logout = vi.hoisted(() => vi.fn());
vi.mock("@/features/auth", () => ({ useAuth: () => ({ logout }) }));

import { ProfileApiError } from "../profileApi";
import { SecurityTab } from "./SecurityTab";

beforeEach(() => {
  vi.clearAllMocks();
  api.changePassword.mockResolvedValue(undefined);
  api.deleteAccount.mockResolvedValue(undefined);
  logout.mockResolvedValue(undefined);
});

async function fillPasswords(current: string, next: string, confirm: string) {
  await userEvent.type(screen.getByLabelText(/Mật khẩu hiện tại/), current);
  await userEvent.type(screen.getByLabelText(/^Mật khẩu mới/), next);
  await userEvent.type(screen.getByLabelText(/Xác nhận mật khẩu mới/), confirm);
  await userEvent.click(screen.getByRole("button", { name: "Đổi mật khẩu" }));
}

describe("change password", () => {
  it("validates before calling the API", async () => {
    render(<SecurityTab />);
    await userEvent.click(screen.getByRole("button", { name: "Đổi mật khẩu" }));
    expect(screen.getByText("Nhập mật khẩu hiện tại.")).toBeInTheDocument();
    expect(screen.getByText("Nhập mật khẩu mới.")).toBeInTheDocument();

    await fillPasswords("Old12345", "alllowercase1", "alllowercase2");
    expect(
      screen.getByText("Mật khẩu phải có chữ hoa, chữ thường và số."),
    ).toBeInTheDocument();
    expect(screen.getByText("Hai mật khẩu không khớp.")).toBeInTheDocument();
    expect(api.changePassword).not.toHaveBeenCalled();
  });

  it("sends the three fields and clears the form on success", async () => {
    render(<SecurityTab />);
    await fillPasswords("Old12345", "New12345", "New12345");
    expect(api.changePassword).toHaveBeenCalledWith({
      currentPassword: "Old12345",
      newPassword: "New12345",
      confirmPassword: "New12345",
    });
    expect(await screen.findByText("Đã đổi mật khẩu.")).toBeInTheDocument();
    expect(screen.getByLabelText(/Mật khẩu hiện tại/)).toHaveValue("");
  });

  it("shows the backend error, e.g. a wrong current password", async () => {
    api.changePassword.mockRejectedValueOnce(
      new ProfileApiError("Mật khẩu hiện tại không đúng", 400),
    );
    render(<SecurityTab />);
    await fillPasswords("Wrong1234", "New12345", "New12345");
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Mật khẩu hiện tại không đúng",
    );
  });

  it("toggles a password field's visibility", async () => {
    render(<SecurityTab />);
    const field = screen.getByLabelText(/Mật khẩu hiện tại/);
    expect(field).toHaveAttribute("type", "password");
    await userEvent.click(
      screen.getByRole("button", { name: "Hiện mật khẩu hiện tại" }),
    );
    expect(field).toHaveAttribute("type", "text");
  });
});

describe("delete account", () => {
  async function openDialog() {
    await userEvent.click(
      screen.getByRole("button", { name: "Xoá tài khoản" }),
    );
    return screen.getByRole("alertdialog");
  }

  it("needs the exact phrase before it can be confirmed", async () => {
    render(<SecurityTab />);
    const dialog = await openDialog();
    const confirm = within(dialog).getByRole("button", {
      name: "Xoá tài khoản",
    });
    expect(confirm).toBeDisabled();

    await userEvent.type(within(dialog).getByRole("textbox"), "xoa tai khoan");
    expect(confirm).toBeDisabled();
    await userEvent.clear(within(dialog).getByRole("textbox"));
    await userEvent.type(within(dialog).getByRole("textbox"), "XOA TAI KHOAN");
    expect(confirm).toBeEnabled();
  });

  it("deletes the account, then signs out", async () => {
    render(<SecurityTab />);
    const dialog = await openDialog();
    await userEvent.type(within(dialog).getByRole("textbox"), "XOA TAI KHOAN");
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Xoá tài khoản" }),
    );
    expect(api.deleteAccount).toHaveBeenCalled();
    await vi.waitFor(() => expect(logout).toHaveBeenCalled());
  });

  it("stays signed in and shows the error when deleting fails", async () => {
    api.deleteAccount.mockRejectedValueOnce(
      new ProfileApiError("Không thể vô hiệu hoá tài khoản", 500),
    );
    render(<SecurityTab />);
    const dialog = await openDialog();
    await userEvent.type(within(dialog).getByRole("textbox"), "XOA TAI KHOAN");
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Xoá tài khoản" }),
    );
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "Không thể vô hiệu hoá tài khoản",
    );
    expect(logout).not.toHaveBeenCalled();
  });

  it("cancelling does not call the API", async () => {
    render(<SecurityTab />);
    const dialog = await openDialog();
    await userEvent.click(within(dialog).getByRole("button", { name: "Huỷ" }));
    expect(api.deleteAccount).not.toHaveBeenCalled();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<SecurityTab />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
