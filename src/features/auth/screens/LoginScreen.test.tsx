import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { LoginScreen } from "./LoginScreen";

const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
const search = vi.hoisted(() => ({ value: "" }));
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  useSearchParams: () => new URLSearchParams(search.value),
}));

vi.mock("../hooks", () => ({
  useAuth: () => ({ login: vi.fn() }),
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
  search.value = "";
});

describe("LoginScreen social sign-in", () => {
  it("offers the providers below the sign-in button", () => {
    render(<LoginScreen />);
    const submit = screen.getByRole("button", { name: "Đăng nhập" });
    const google = screen.getByRole("button", {
      name: "Đăng nhập với Google",
    });
    expect(
      submit.compareDocumentPosition(google) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.getByText("hoặc")).toBeInTheDocument();
  });

  it("starts the redirect for the chosen provider and locks the buttons", async () => {
    render(<LoginScreen />);
    await userEvent.click(
      screen.getByRole("button", { name: "Đăng nhập với Facebook" }),
    );
    expect(social.startSocialLogin).toHaveBeenCalledWith("facebook");
    expect(
      screen.getByRole("button", { name: "Đăng nhập với Google" }),
    ).toBeDisabled();
  });
});

describe("LoginScreen notices", () => {
  it("welcomes a visitor who has just registered", () => {
    search.value = "registered=1";
    render(<LoginScreen />);
    expect(screen.getByText(/Đăng ký thành công/)).toBeVisible();
  });

  it("confirms a password reset", () => {
    search.value = "reset=1";
    render(<LoginScreen />);
    expect(screen.getByText(/Đã đặt lại mật khẩu/)).toBeVisible();
  });
});
