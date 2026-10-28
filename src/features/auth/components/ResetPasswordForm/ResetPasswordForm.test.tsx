import { vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { ResetPasswordForm } from "./ResetPasswordForm";

expect.extend(toHaveNoViolations);

describe("ResetPasswordForm", () => {
  it("submits the new password when both entries match", async () => {
    const onSubmit = vi.fn();
    render(<ResetPasswordForm onSubmit={onSubmit} />);
    await userEvent.type(screen.getByLabelText(/^Mật khẩu mới/), "matkhau123");
    await userEvent.type(
      screen.getByLabelText(/^Nhập lại mật khẩu mới/),
      "matkhau123",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Đặt lại mật khẩu" }),
    );
    expect(onSubmit).toHaveBeenCalledWith({ password: "matkhau123" });
  });

  it("blocks submit and focuses the first invalid field", async () => {
    const onSubmit = vi.fn();
    render(<ResetPasswordForm onSubmit={onSubmit} />);
    await userEvent.click(
      screen.getByRole("button", { name: "Đặt lại mật khẩu" }),
    );
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("Nhập mật khẩu mới.")).toBeInTheDocument();
    expect(screen.getByLabelText(/^Mật khẩu mới/)).toHaveFocus();
  });

  it("rejects a short password and a mismatch", async () => {
    const onSubmit = vi.fn();
    render(<ResetPasswordForm onSubmit={onSubmit} />);
    await userEvent.type(screen.getByLabelText(/^Mật khẩu mới/), "short");
    await userEvent.click(
      screen.getByRole("button", { name: "Đặt lại mật khẩu" }),
    );
    expect(screen.getByText("Dùng ít nhất 8 ký tự.")).toBeInTheDocument();

    await userEvent.clear(screen.getByLabelText(/^Mật khẩu mới/));
    await userEvent.type(screen.getByLabelText(/^Mật khẩu mới/), "matkhau123");
    await userEvent.type(
      screen.getByLabelText(/^Nhập lại mật khẩu mới/),
      "khacnhau123",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Đặt lại mật khẩu" }),
    );
    expect(screen.getByText("Hai mật khẩu không khớp.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows a form-level error and a sign-in link", () => {
    render(
      <ResetPasswordForm
        onSubmit={() => {}}
        error="Liên kết đã hết hạn."
        signInHref="/login"
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Liên kết đã hết hạn.");
    expect(
      screen.getByRole("link", { name: "Quay lại đăng nhập" }),
    ).toHaveAttribute("href", "/login");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<ResetPasswordForm onSubmit={() => {}} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
