import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { AxiosError } from "axios";
import { vi } from "vitest";
import {
  AuthApiError,
  clearTokens,
  getAccessToken,
  getMeApi,
  getRefreshToken,
  getTokenExpiry,
  authApi as publicAuthApi,
  registerApi,
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

const ME = {
  id: "1",
  email: "a@b.co",
  displayName: "A",
  avatarUrl: null,
  role: "USER",
};

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

    const user = { id: "1", email: "a@b.co", name: "A" };
    expect(results).toEqual([user, user, user]);
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

/** A JWT-shaped string whose payload carries the given expiry (seconds). */
function jwt(expSeconds: number): string {
  const encode = (value: object) =>
    btoa(JSON.stringify(value))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  return `${encode({ alg: "HS256" })}.${encode({ sub: "1", exp: expSeconds })}.sig`;
}

describe("account endpoints", () => {
  it("registers with displayName, the field the backend expects", async () => {
    const backend = mockBackend((config) => respond(config, 201, {}));
    await registerApi("An Nguyễn", "a@b.co", "Passw0rd");

    const config = backend.mock.calls[0][0] as InternalAxiosRequestConfig;
    expect(config.url).toBe("/auth/register");
    expect(JSON.parse(config.data)).toEqual({
      displayName: "An Nguyễn",
      email: "a@b.co",
      password: "Passw0rd",
    });
  });

  it("maps a 409 on register to email_taken", async () => {
    mockBackend((config) =>
      respond(config, 409, { message: "Email đã được sử dụng" }),
    );
    await expect(registerApi("A", "a@b.co", "Passw0rd")).rejects.toMatchObject({
      code: "email_taken",
    });
  });

  it("turns /auth/me into the app's user, with displayName as name", async () => {
    setTokens("access-1", "refresh-1");
    mockBackend((config) => respond(config, 200, ME));
    await expect(getMeApi()).resolves.toEqual({
      id: "1",
      email: "a@b.co",
      name: "A",
    });
  });
});

describe("getTokenExpiry", () => {
  it("reads exp from a JWT, in milliseconds", () => {
    expect(getTokenExpiry(jwt(1_800_000_000))).toBe(1_800_000_000_000);
  });

  it("returns undefined for anything that is not a JWT with exp", () => {
    expect(getTokenExpiry("access-1")).toBeUndefined();
    expect(getTokenExpiry("a.b.c")).toBeUndefined();
    expect(getTokenExpiry("")).toBeUndefined();
  });
});

describe("renewing before the access token expires", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    clearTokens();
    vi.useRealTimers();
  });

  const nowSeconds = () => Math.floor(Date.now() / 1000);

  it("refreshes a minute before expiry and schedules the next renewal", async () => {
    let refreshCalls = 0;
    let latest = "";
    mockBackend((config) => {
      refreshCalls += 1;
      latest = jwt(nowSeconds() + 900);
      return respond(config, 200, {
        accessToken: latest,
        refreshToken: "refresh-2",
      });
    });
    setTokens(jwt(nowSeconds() + 300), "refresh-1");

    await vi.advanceTimersByTimeAsync(239_000);
    expect(refreshCalls).toBe(0); // 4 minutes in, one minute of lead still to go

    await vi.advanceTimersByTimeAsync(2_000);
    expect(refreshCalls).toBe(1);
    expect(getAccessToken()).toBe(latest);
    expect(getRefreshToken()).toBe("refresh-2");

    // The new token schedules the next one (900s - 60s from now).
    await vi.advanceTimersByTimeAsync(830_000);
    expect(refreshCalls).toBe(1);
    await vi.advanceTimersByTimeAsync(20_000);
    expect(refreshCalls).toBe(2);
  });

  it("renews a very short-lived token at half its life, not in a tight loop", async () => {
    let refreshCalls = 0;
    mockBackend((config) => {
      refreshCalls += 1;
      return respond(config, 200, {
        accessToken: jwt(nowSeconds() + 30),
        refreshToken: "refresh-2",
      });
    });
    setTokens(jwt(nowSeconds() + 30), "refresh-1");

    await vi.advanceTimersByTimeAsync(14_000);
    expect(refreshCalls).toBe(0);
    await vi.advanceTimersByTimeAsync(2_000);
    expect(refreshCalls).toBe(1);
    // Each 30s token is renewed every ~15s: a handful of calls a minute, not dozens.
    await vi.advanceTimersByTimeAsync(60_000);
    expect(refreshCalls).toBeLessThanOrEqual(6);
  });

  it("does nothing for a token it cannot read, and stops when the session is cleared", async () => {
    let refreshCalls = 0;
    mockBackend((config) => {
      refreshCalls += 1;
      return respond(config, 200, { accessToken: "x", refreshToken: "y" });
    });
    setTokens("not-a-jwt", "refresh-1");
    await vi.advanceTimersByTimeAsync(3_600_000);
    expect(refreshCalls).toBe(0);

    setTokens(jwt(nowSeconds() + 300), "refresh-1");
    clearTokens();
    await vi.advanceTimersByTimeAsync(3_600_000);
    expect(refreshCalls).toBe(0);
  });

  it("ends the session when the renewal is rejected", async () => {
    const onSessionExpired = vi.fn();
    setSessionHandlers({ onSessionExpired });
    mockBackend((config) => respond(config, 401, {}));
    setTokens(jwt(nowSeconds() + 120), "refresh-1");

    await vi.advanceTimersByTimeAsync(61_000);

    expect(onSessionExpired).toHaveBeenCalledTimes(1);
    expect(getAccessToken()).toBeNull();
  });

  it("keeps the session when the backend is merely unreachable", async () => {
    const onSessionExpired = vi.fn();
    setSessionHandlers({ onSessionExpired });
    adapter.mockReset();
    adapter.mockRejectedValue(new AxiosError("Network Error"));
    setTokens(jwt(nowSeconds() + 120), "refresh-1");

    await vi.advanceTimersByTimeAsync(61_000);

    expect(onSessionExpired).not.toHaveBeenCalled();
    expect(getRefreshToken()).toBe("refresh-1");
  });
});

describe("backend error bodies", () => {
  const nestBody = (message: string | string[]) => ({
    message,
    error: "Bad Request",
    statusCode: 400,
  });

  it("keeps the rule a 400 validation error names, joined into one sentence", async () => {
    mockBackend((config) =>
      respond(
        config,
        400,
        nestBody(["Mật khẩu phải có chữ hoa, chữ thường và số"]),
      ),
    );
    await expect(registerApi("A", "a@b.co", "weakpass")).rejects.toMatchObject({
      code: "validation",
      status: 400,
      serverMessage: "Mật khẩu phải có chữ hoa, chữ thường và số",
    });

    mockBackend((config) =>
      respond(
        config,
        400,
        nestBody(["email must be an email", "password is too short"]),
      ),
    );
    await expect(registerApi("A", "x", "y")).rejects.toMatchObject({
      serverMessage: "email must be an email password is too short",
    });
  });

  it("does not mistake a weak new password for an expired reset link", async () => {
    mockBackend((config) =>
      respond(
        config,
        400,
        nestBody(["Mật khẩu phải có chữ hoa, chữ thường và số"]),
      ),
    );
    await expect(
      publicAuthApi.resetPassword({ token: "t", password: "weak" }),
    ).rejects.toMatchObject({ code: "validation" });
  });

  it("still maps the backend's own 400 for a bad reset token to invalid_token", async () => {
    mockBackend((config) =>
      respond(config, 400, nestBody("Token không hợp lệ hoặc đã hết hạn")),
    );
    await expect(
      publicAuthApi.resetPassword({ token: "t", password: "Passw0rd" }),
    ).rejects.toMatchObject({
      code: "invalid_token",
      serverMessage: "Token không hợp lệ hoặc đã hết hạn",
    });
  });
});
