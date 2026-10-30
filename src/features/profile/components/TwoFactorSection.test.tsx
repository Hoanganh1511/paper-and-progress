import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { vi } from "vitest";

expect.extend(toHaveNoViolations);

const api = vi.hoisted(() => ({
  getTotpEnabled: vi.fn(),
  setupTotp: vi.fn(),
  enableTotp: vi.fn(),
  disableTotp: vi.fn(),
  regenerateRecoveryCodes: vi.fn(),
}));
vi.mock("../totpApi", () => api);

import { TwoFactorSection } from "./TwoFactorSection";

beforeEach(() => {
  vi.clearAllMocks();
  api.getTotpEnabled.mockResolvedValue(false);
  api.setupTotp.mockResolvedValue({
    otpauthUri: "otpauth://totp/App:a@b.c?secret=ABC",
    secret: "ABC",
  });
  api.enableTotp.mockResolvedValue(["aaaa-bbbb", "cccc-dddd"]);
  api.disableTotp.mockResolvedValue(undefined);
  api.regenerateRecoveryCodes.mockResolvedValue(["eeee-ffff"]);
});

describe("TwoFactorSection", () => {
  it("enables 2FA: shows the QR code, then the recovery codes", async () => {
    const { container } = render(<TwoFactorSection />);
    await userEvent.click(
      await screen.findByRole("button", { name: "Bật xác thực hai bước" }),
    );
    expect(await screen.findByText("ABC")).toBeInTheDocument();
    expect(container.querySelector("svg")).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();

    await userEvent.type(screen.getByLabelText(/Mã xác thực/), "123456");
    await userEvent.click(
      screen.getByRole("button", { name: "Xác nhận và bật" }),
    );
    expect(api.enableTotp).toHaveBeenCalledWith("123456");
    expect(await screen.findByText("aaaa-bbbb")).toBeInTheDocument();
  });

  it("rejects a code that is not six digits", async () => {
    api.getTotpEnabled.mockResolvedValue(true);
    render(<TwoFactorSection />);
    await userEvent.click(
      await screen.findByRole("button", { name: "Tắt xác thực hai bước" }),
    );
    await userEvent.type(screen.getByLabelText(/Mã xác thực/), "12");
    await userEvent.click(
      screen.getByRole("button", { name: "Tắt xác thực hai bước" }),
    );
    expect(screen.getByText("Nhập đủ 6 số.")).toBeInTheDocument();
    expect(api.disableTotp).not.toHaveBeenCalled();
  });

  it("disables 2FA with a code and the password", async () => {
    api.getTotpEnabled.mockResolvedValue(true);
    render(<TwoFactorSection />);
    await userEvent.click(
      await screen.findByRole("button", { name: "Tắt xác thực hai bước" }),
    );
    await userEvent.type(screen.getByLabelText(/Mã xác thực/), "123456");
    await userEvent.type(screen.getByLabelText(/^Mật khẩu/), "Secret123");
    await userEvent.click(
      screen.getByRole("button", { name: "Tắt xác thực hai bước" }),
    );
    expect(api.disableTotp).toHaveBeenCalledWith("123456", "Secret123");
    expect(
      await screen.findByRole("button", { name: "Bật xác thực hai bước" }),
    ).toBeInTheDocument();
  });

  it("regenerates recovery codes", async () => {
    api.getTotpEnabled.mockResolvedValue(true);
    render(<TwoFactorSection />);
    await userEvent.click(
      await screen.findByRole("button", { name: "Tạo lại mã khôi phục" }),
    );
    await userEvent.type(screen.getByLabelText(/Mã xác thực/), "123456");
    await userEvent.click(
      screen.getByRole("button", { name: "Tạo mã khôi phục mới" }),
    );
    expect(await screen.findByText("eeee-ffff")).toBeInTheDocument();
  });
});
