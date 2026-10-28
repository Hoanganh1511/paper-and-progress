import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { AxiosError } from "axios";
import { vi } from "vitest";
import {
  AuthApiError,
  clearTokens,
  getAccessToken,
  getMeApi,
  getRefreshToken,
  loginApi,
  setSessionHandlers,
  setTokens,
} from "./authApi";

// Both axios instances (main and refresh client) copy the global defaults when
// they are created, so the adapter is swapped in before authApi is imported.
const { adapter } = vi.hoisted(() => ({ adapter: vi.fn() }));

vi.mock("axios", async (importOriginal) => {
  const actual = await importOriginal<typeof import("axios")>();
  actual.default.defaults.adapter = adapter;
  return actual;
});

const ME = { id: "1", email: "a@b.co", name: "A" };

function respond(
  config: InternalAxiosRequestConfig,
  status: number,
  data: unknown,
): AxiosResponse | Promise<never> {
  const response = {
    data,
    status,
    statusText: "",
    headers: {},
    config,
  } as AxiosResponse;
  if (status < 400) return response;
  return Promise.reject(
    new AxiosError("failed", String(status), config, null, response),
  );
}

function mockBackend(
  handler: (
    config: InternalAxiosRequestConfig,
  ) => AxiosResponse | Promise<never>,
) {
  adapter.mockReset();
  adapter.mockImplementation(async (config) => handler(config));
  return adapter;
}

beforeEach(() => {
  clearTokens();
  localStorage.clear();
  setSessionHandlers({});
});

describe("authApi", () => {
  it("attaches the access token to requests", async () => {
    setTokens("access-1", "refresh-1");
    const adapter = mockBackend((config) => respond(config, 200, ME));

    await getMeApi();

    const sent = adapter.mock.calls[0][0];
    expect(sent.headers.get("Authorization")).toBe("Bearer access-1");
  });

  it("keeps the access token in memory and the refresh token in localStorage", () => {
    setTokens("access-1", "refresh-1");

    expect(getAccessToken()).toBe("access-1");
    expect(getRefreshToken()).toBe("refresh-1");
    expect(localStorage.getItem("pp.refreshToken")).toBe("refresh-1");
    expect(JSON.stringify(localStorage)).not.toContain("access-1");
  });

  it("maps a 401 on login to invalid_credentials", async () => {
    mockBackend((config) => respond(config, 401, {}));

    await expect(loginApi("a@b.co", "x")).rejects.toMatchObject({
      code: "invalid_credentials",
      status: 401,
    });
  });

  it("maps an unreachable backend to the network error", async () => {
    adapter.mockReset();
    adapter.mockRejectedValue(new AxiosError("Network Error"));

    await expect(loginApi("a@b.co", "x")).rejects.toBeInstanceOf(AuthApiError);
    await expect(loginApi("a@b.co", "x")).rejects.toMatchObject({
      code: "network",
    });
  });

  it("refreshes once for several parallel 401s, then retries them all", async () => {
    setTokens("stale", "refresh-1");
    let refreshCalls = 0;
    mockBackend((config) => {
      if (config.url === "/auth/refresh") {
        refreshCalls += 1;
        return respond(config, 200, {
          accessToken: "fresh",
          refreshToken: "refresh-2",
        });
      }
      const isFresh = config.headers.get("Authorization") === "Bearer fresh";
      return isFresh ? respond(config, 200, ME) : respond(config, 401, {});
    });

    const results = await Promise.all([getMeApi(), getMeApi(), getMeApi()]);

    expect(results).toEqual([ME, ME, ME]);
    expect(refreshCalls).toBe(1);
    expect(getAccessToken()).toBe("fresh");
    expect(getRefreshToken()).toBe("refresh-2");
  });

  it("clears the session and notifies when the refresh is rejected", async () => {
    setTokens("stale", "refresh-1");
    const onSessionExpired = vi.fn();
    setSessionHandlers({ onSessionExpired });
    mockBackend((config) => respond(config, 401, {}));

    await expect(getMeApi()).rejects.toBeInstanceOf(AuthApiError);

    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(onSessionExpired).toHaveBeenCalledTimes(1);
  });

  it("keeps the refresh token when the backend is down during a refresh", async () => {
    setTokens("stale", "refresh-1");
    const onSessionExpired = vi.fn();
    setSessionHandlers({ onSessionExpired });
    mockBackend((config) =>
      config.url === "/auth/refresh"
        ? respond(config, 503, {})
        : respond(config, 401, {}),
    );

    await expect(getMeApi()).rejects.toBeInstanceOf(AuthApiError);

    expect(getRefreshToken()).toBe("refresh-1");
    expect(onSessionExpired).not.toHaveBeenCalled();
  });

  it("flags a suspended account without trying to refresh", async () => {
    setTokens("access-1", "refresh-1");
    const onAccountSuspended = vi.fn();
    setSessionHandlers({ onAccountSuspended });
    mockBackend((config) =>
      respond(config, 403, { code: "account_suspended" }),
    );

    await expect(getMeApi()).rejects.toMatchObject({
      code: "account_suspended",
    });
    expect(onAccountSuspended).toHaveBeenCalledTimes(1);
  });
});
