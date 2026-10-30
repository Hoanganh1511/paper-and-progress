import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { vi } from "vitest";

expect.extend(toHaveNoViolations);

const api = vi.hoisted(() => ({ deleteAccount: vi.fn() }));
vi.mock("../profileApi", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../profileApi")>()),
  ...api,
}));

const logout = vi.hoisted(() => vi.fn());
vi.mock("@/features/auth", () => ({ useAuth: () => ({ logout }) }));

import { ProfileApiError } from "../profileApi";
import { DeleteAccountSection } from "./DeleteAccountSection";

beforeEach(() => {
  vi.clearAllMocks();
  api.deleteAccount.mockResolvedValue(undefined);
  logout.mockResolvedValue(undefined);
});

describe("DeleteAccountSection", () => {
  async function openDialog() {
    await userEvent.click(
      screen.getByRole("button", { name: "Xoá tài khoản" }),
    );
    return screen.getByRole("alertdialog");
  }

  it("needs the exact phrase before it can be confirmed", async () => {
    render(<DeleteAccountSection />);
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
    render(<DeleteAccountSection />);
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
    render(<DeleteAccountSection />);
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
    render(<DeleteAccountSection />);
    const dialog = await openDialog();
    await userEvent.click(within(dialog).getByRole("button", { name: "Huỷ" }));
    expect(api.deleteAccount).not.toHaveBeenCalled();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<DeleteAccountSection />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
