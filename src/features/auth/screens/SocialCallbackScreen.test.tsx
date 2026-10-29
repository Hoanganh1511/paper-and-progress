import { StrictMode } from "react";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { AuthApiError } from "../authApi";
import { SocialCallbackScreen } from "./SocialCallbackScreen";

const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
const search = vi.hoisted(() => ({ value: "" }));
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  useSearchParams: () => new URLSearchParams(search.value),
}));

const loginWithTokens = vi.hoisted(() => vi.fn());
vi.mock("../hooks", () => ({ useAuth: () => ({ loginWithTokens }) }));

beforeEach(() => {
  vi.clearAllMocks();
  loginWithTokens.mockResolvedValue(undefined);
});

function visit(query: string) {
  search.value = query;
  return render(<SocialCallbackScreen />);
}

describe("SocialCallbackScreen", () => {
  it("shows a spinner, signs in with the tokens and continues to the app", async () => {
    visit("accessToken=acc&refreshToken=ref");
    expect(screen.getAllByText("Đang đăng nhập...").length).toBeGreaterThan(0);

    await vi.waitFor(() => expect(router.replace).toHaveBeenCalledWith("/"));
    expect(loginWithTokens).toHaveBeenCalledWith({
      accessToken: "acc",
      refreshToken: "ref",
    });
  });

  it("takes the tokens out of the address bar", async () => {
    const replaceState = vi.spyOn(window.history, "replaceState");
    visit("accessToken=acc&refreshToken=ref");
    await vi.waitFor(() => expect(router.replace).toHaveBeenCalled());
    expect(replaceState).toHaveBeenCalledWith(
      null,
      "",
      window.location.pathname,
    );
  });

  it("signs in only once, even when React runs the effect twice", async () => {
    search.value = "accessToken=acc&refreshToken=ref";
    render(
      <StrictMode>
        <SocialCallbackScreen />
      </StrictMode>,
    );
    await vi.waitFor(() => expect(router.replace).toHaveBeenCalled());
    expect(loginWithTokens).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["accessToken=acc", "only one token"],
    ["", "no query at all"],
  ])(
    "shows an error and a link to /login when %s is missing (%s)",
    async (query) => {
      visit(query);
      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Không nhận được thông tin đăng nhập",
      );
      expect(
        screen.getByRole("link", { name: "Quay lại đăng nhập" }),
      ).toHaveAttribute("href", "/login");
      expect(loginWithTokens).not.toHaveBeenCalled();
      expect(router.replace).not.toHaveBeenCalled();
    },
  );

  it("explains an email-less provider account", async () => {
    visit("error=EMAIL_REQUIRED");
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "không chia sẻ địa chỉ email",
    );
  });

  it("explains a disabled account", async () => {
    visit("error=ACCOUNT_DISABLED");
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Tài khoản đã bị khoá",
    );
  });

  it("never shows an error text it does not know, e.g. an internal message", async () => {
    visit(
      "error=Unique%20constraint%20failed%20on%20the%20fields%3A%20(email)",
    );
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Đăng nhập không thành công");
    expect(alert).not.toHaveTextContent("constraint");
  });

  it("shows an error when the backend rejects the tokens", async () => {
    loginWithTokens.mockRejectedValue(new AuthApiError("invalid_token", 401));
    visit("accessToken=acc&refreshToken=ref");
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Đăng nhập không thành công",
    );
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("shows the network message when the backend is unreachable", async () => {
    loginWithTokens.mockRejectedValue(new AuthApiError("network"));
    visit("accessToken=acc&refreshToken=ref");
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Không kết nối được máy chủ",
    );
  });
});
