import { vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { MfaChallenge } from "./MfaChallenge";

expect.extend(toHaveNoViolations);

describe("MfaChallenge", () => {
  it("starts with the one-time code form", () => {
    render(<MfaChallenge onVerify={() => {}} />);
    expect(
      screen.getByRole("heading", { name: "Xác thực hai bước" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Dùng mã backup" }),
    ).toBeInTheDocument();
  });

  it("verifies a six-digit code", async () => {
    const onVerify = vi.fn();
    render(<MfaChallenge onVerify={onVerify} />);
    await userEvent.click(screen.getByLabelText("Số 1 trên 6"));
    await userEvent.keyboard("123456");
    await userEvent.click(screen.getByRole("button", { name: "Xác nhận" }));
    expect(onVerify).toHaveBeenCalledWith({
      code: "123456",
      isBackupCode: false,
    });
  });

  it("switches to a backup code and back", async () => {
    const onVerify = vi.fn();
    render(<MfaChallenge onVerify={onVerify} />);
    await userEvent.click(
      screen.getByRole("button", { name: "Dùng mã backup" }),
    );
    expect(
      screen.getByRole("heading", { name: "Dùng mã backup" }),
    ).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText(/^Mã backup/), "abcd-efgh");
    await userEvent.click(screen.getByRole("button", { name: "Xác nhận" }));
    expect(onVerify).toHaveBeenCalledWith({
      code: "abcd-efgh",
      isBackupCode: true,
    });

    await userEvent.click(
      screen.getByRole("button", { name: "Dùng mã từ ứng dụng xác thực" }),
    );
    expect(
      screen.getByRole("heading", { name: "Xác thực hai bước" }),
    ).toBeInTheDocument();
  });

  it("requires a backup code", async () => {
    const onVerify = vi.fn();
    render(<MfaChallenge onVerify={onVerify} />);
    await userEvent.click(
      screen.getByRole("button", { name: "Dùng mã backup" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Xác nhận" }));
    expect(screen.getByText("Nhập mã backup.")).toBeInTheDocument();
    expect(screen.getByLabelText(/^Mã backup/)).toHaveFocus();
    expect(onVerify).not.toHaveBeenCalled();
  });

  it("has no accessibility violations in either mode", async () => {
    const { container } = render(<MfaChallenge onVerify={() => {}} />);
    expect(await axe(container)).toHaveNoViolations();
    await userEvent.click(
      screen.getByRole("button", { name: "Dùng mã backup" }),
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
