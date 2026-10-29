import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import * as authApi from "../authApi";
import { useAuth } from "../hooks";
import { AuthProvider } from "./AuthProvider";

const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

vi.mock("../authApi", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../authApi")>()),
  refreshSession: vi.fn(),
  getMeApi: vi.fn(),
  loginApi: vi.fn(),
  logoutApi: vi.fn(),
}));

const ME = { id: "1", email: "a@b.co", name: "An" };

function Probe() {
  const { user, status, isLoading, login, logout, loginWithTokens } = useAuth();
  return (
    <div>
      <p data-testid="status">{status}</p>
      <p data-testid="loading">{String(isLoading)}</p>
      <p data-testid="user">{user?.email ?? "none"}</p>
      <button onClick={() => login({ email: "a@b.co", password: "pw" })}>
        login
      </button>
      <button onClick={() => logout()}>logout</button>
      <button
        onClick={() => loginWithTokens({ accessToken: "a", refreshToken: "r" })}
      >
        tokens
      </button>
    </div>
  );
}

function renderProvider() {
  return render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  authApi.clearTokens();
  localStorage.clear();
});

describe("AuthProvider", () => {
  it("is signed out right away when no refresh token is stored", async () => {
    renderProvider();

    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("unauthenticated"),
    );
    expect(screen.getByTestId("loading")).toHaveTextContent("false");
    expect(authApi.refreshSession).not.toHaveBeenCalled();
  });

  it("restores the user from the stored refresh token", async () => {
    authApi.setTokens("old", "refresh-1");
    vi.mocked(authApi.refreshSession).mockResolvedValue("new");
    vi.mocked(authApi.getMeApi).mockResolvedValue(ME);

    renderProvider();
    expect(screen.getByTestId("loading")).toHaveTextContent("true");

    await waitFor(() =>
      expect(screen.getByTestId("user")).toHaveTextContent("a@b.co"),
    );
    expect(screen.getByTestId("status")).toHaveTextContent("authenticated");
  });

  it("falls back to signed out when the stored session is rejected", async () => {
    authApi.setTokens("old", "refresh-1");
    vi.mocked(authApi.refreshSession).mockRejectedValue(
      new authApi.AuthApiError("invalid_token", 401),
    );

    renderProvider();

    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("unauthenticated"),
    );
    expect(screen.getByTestId("user")).toHaveTextContent("none");
  });

  it("logs in, then logs out even if the backend call fails", async () => {
    vi.mocked(authApi.loginApi).mockResolvedValue({
      status: "authenticated",
      tokens: { accessToken: "a", refreshToken: "r" },
    });
    vi.mocked(authApi.getMeApi).mockResolvedValue(ME);
    vi.mocked(authApi.logoutApi).mockRejectedValue(
      new authApi.AuthApiError("network"),
    );
    const user = userEvent.setup();
    renderProvider();

    await user.click(screen.getByRole("button", { name: "login" }));
    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("authenticated"),
    );
    expect(authApi.getRefreshToken()).toBe("r");

    await user.click(screen.getByRole("button", { name: "logout" }));

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/login"));
    expect(screen.getByTestId("user")).toHaveTextContent("none");
    expect(authApi.getRefreshToken()).toBeNull();
    expect(authApi.logoutApi).toHaveBeenCalledWith("r");
  });

  it("signs in with tokens the backend already issued (social sign-in)", async () => {
    vi.mocked(authApi.getMeApi).mockResolvedValue(ME);
    const user = userEvent.setup();
    renderProvider();

    await user.click(screen.getByRole("button", { name: "tokens" }));

    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("authenticated"),
    );
    expect(authApi.getAccessToken()).toBe("a");
    expect(authApi.getRefreshToken()).toBe("r");
    expect(screen.getByTestId("user")).toHaveTextContent("a@b.co");
  });
});
