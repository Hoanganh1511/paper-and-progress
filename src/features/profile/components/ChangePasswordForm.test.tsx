import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

const api = vi.hoisted(() => ({ changePassword: vi.fn() }));
vi.mock("../profileApi", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../profileApi")>()),
  ...api,
}));

import { ProfileApiError } from "../profileApi";
import { ChangePasswordForm } from "./ChangePasswordForm";

beforeEach(() => {
  vi.clearAllMocks();
  api.changePassword.mockResolvedValue(undefined);
});

async function fillPasswords(current: string, next: string, confirm: string) {
  await userEvent.type(screen.getByLabelText(/Mật khẩu hiện tại/), current);
  await userEvent.type(screen.getByLabelText(/^Mật khẩu mới/), next);
  await userEvent.type(screen.getByLabelText(/Xác nhận mật khẩu mới/), confirm);
  await userEvent.click(screen.getByRole("button", { name: "Đổi mật khẩu" }));
}

describe("ChangePasswordForm", () => {
  it("validates before calling the API", async () => {
    render(<ChangePasswordForm />);
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
    render(<ChangePasswordForm />);
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
    render(<ChangePasswordForm />);
    await fillPasswords("Wrong1234", "New12345", "New12345");
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Mật khẩu hiện tại không đúng",
    );
  });

  it("toggles a password field's visibility", async () => {
    render(<ChangePasswordForm />);
    const field = screen.getByLabelText(/Mật khẩu hiện tại/);
    expect(field).toHaveAttribute("type", "password");
    await userEvent.click(
      screen.getByRole("button", { name: "Hiện mật khẩu hiện tại" }),
    );
    expect(field).toHaveAttribute("type", "text");
  });
});
