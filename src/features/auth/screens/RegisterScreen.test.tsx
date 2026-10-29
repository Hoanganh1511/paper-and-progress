import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { AuthApiError } from "../authApi";
import { RegisterScreen } from "./RegisterScreen";

const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

const register = vi.hoisted(() => vi.fn());
vi.mock("../hooks", () => ({
  useAuth: () => ({ register }),
  useRateLimit: () => ({
    isLimited: false,
    secondsLeft: 0,
    handle: () => false,
  }),
}));

const social = vi.hoisted(() => ({ startSocialLogin: vi.fn() }));
vi.mock("../socialAuth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../socialAuth")>()),
  ...social,
}));

beforeEach(() => {
  vi.clearAllMocks();
  register.mockResolvedValue(undefined);
});

async function fillAndSubmit() {
  await userEvent.type(screen.getByLabelText(/Họ và tên/), "An Nguyễn");
  await userEvent.type(screen.getByLabelText(/^Email/), "an@example.com");
  await userEvent.type(screen.getByLabelText(/^Mật khẩu/), "Passw0rd");
  await userEvent.type(screen.getByLabelText(/Nhập lại mật khẩu/), "Passw0rd");
  await userEvent.click(screen.getByRole("checkbox"));
  await userEvent.click(screen.getByRole("button", { name: "Đăng ký" }));
}

describe("RegisterScreen", () => {
  it("creates the account and sends the visitor to sign in, with no email-verification step", async () => {
    render(<RegisterScreen />);
    await fillAndSubmit();

    await vi.waitFor(() =>
      expect(router.push).toHaveBeenCalledWith("/login?registered=1"),
    );
    expect(register).toHaveBeenCalledWith({
      name: "An Nguyễn",
      email: "an@example.com",
      password: "Passw0rd",
    });
  });

  it("marks an email that is already registered", async () => {
    register.mockRejectedValue(new AuthApiError("email_taken", 409));
    render(<RegisterScreen />);
    await fillAndSubmit();
    expect(
      await screen.findByText("Email này đã được đăng ký."),
    ).toBeInTheDocument();
    expect(router.push).not.toHaveBeenCalled();
  });

  it("shows the rule the backend says the password broke", async () => {
    register.mockRejectedValue(
      new AuthApiError(
        "validation",
        400,
        {},
        undefined,
        "Mật khẩu phải có chữ hoa, chữ thường và số",
      ),
    );
    render(<RegisterScreen />);
    await fillAndSubmit();
    expect(
      await screen.findByText("Mật khẩu phải có chữ hoa, chữ thường và số"),
    ).toBeInTheDocument();
    expect(router.push).not.toHaveBeenCalled();
  });

  it("offers sign-up through the providers too", async () => {
    render(<RegisterScreen />);
    expect(screen.getByText("hoặc")).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Đăng ký với GitHub" }),
    );
    expect(social.startSocialLogin).toHaveBeenCalledWith("github");
  });
});
