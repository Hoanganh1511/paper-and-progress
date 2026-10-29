import axios, {
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const API_BASE_URL = `${API_URL}/api/v1`;
const REFRESH_TOKEN_KEY = "pp.refreshToken";

/** Error codes the backend sends in `{ code }`; anything else is `unknown`. */
export type AuthErrorCode =
  | "invalid_credentials"
  | "email_taken"
  | "email_not_verified"
  | "invalid_token"
  | "invalid_code"
  | "rate_limited"
  | "account_suspended"
  | "network"
  | "unknown";

const AUTH_ERROR_CODES: readonly string[] = [
  "invalid_credentials",
  "email_taken",
  "email_not_verified",
  "invalid_token",
  "invalid_code",
  "rate_limited",
  "account_suspended",
] satisfies AuthErrorCode[];

export class AuthApiError extends Error {
  readonly code: AuthErrorCode;
  readonly status: number;
  /** Per-field messages when the backend rejected a specific input. */
  readonly fieldErrors: Record<string, string>;
  /** Seconds to wait before retrying; only set on a 429. */
  readonly retryAfter?: number;
  /** The backend's own `message`, shown for errors with no known `code`. */
  readonly serverMessage?: string;

  constructor(
    code: AuthErrorCode,
    status = 0,
    fieldErrors: Record<string, string> = {},
    retryAfter?: number,
    serverMessage?: string,
  ) {
    super(code);
    this.name = "AuthApiError";
    this.code = code;
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.retryAfter = retryAfter;
    this.serverMessage = serverMessage;
  }
}

export interface User {
  id: string;
  email: string;
  name: string | null;
}

export interface AuthTokens {
  accessToken: string;
  /** Sent when the backend rotates the refresh token; the old one is kept otherwise. */
  refreshToken?: string;
}

export type LoginResult =
  | { status: "authenticated"; tokens: AuthTokens }
  /** 2FA is on: send the user to `/mfa-challenge` with this ticket. */
  | { status: "mfa_required"; mfaToken: string };

/* -------------------------------------------------------------------------- */
/* Token storage                                                              */
/* -------------------------------------------------------------------------- */

// The access token lives only in this variable: a page reload drops it, and
// the session is restored from the refresh token. The refresh token is in
// localStorage, so it is readable by any script on the page.
let accessToken: string | null = null;

function readRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function getRefreshToken(): string | null {
  return readRefreshToken();
}

export function setTokens(access: string, refresh: string): void {
  accessToken = access;
  try {
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  } catch {
    // Storage blocked (private mode): the session just won't survive a reload.
  }
}

export function clearTokens(): void {
  accessToken = null;
  try {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    // Nothing to clear.
  }
}

/* -------------------------------------------------------------------------- */
/* Session events                                                             */
/* -------------------------------------------------------------------------- */

interface SessionHandlers {
  /** A refresh was rejected: the session is over. */
  onSessionExpired?: () => void;
  /** An API call answered 403 `account_suspended`. */
  onAccountSuspended?: () => void;
}

let sessionHandlers: SessionHandlers = {};

/** Lets the provider react to session loss detected inside the interceptors. */
export function setSessionHandlers(handlers: SessionHandlers): void {
  sessionHandlers = handlers;
}

/* -------------------------------------------------------------------------- */
/* Error mapping                                                              */
/* -------------------------------------------------------------------------- */

interface ErrorBody {
  code?: string;
  errors?: Record<string, string>;
  retryAfter?: number;
  message?: unknown;
}

function codeFromStatus(status: number, url = ""): AuthErrorCode {
  if (status === 429) return "rate_limited";
  if (status === 409) return "email_taken";
  if (status === 401) {
    if (url.endsWith("/login")) return "invalid_credentials";
    return url.includes("/mfa/") ? "invalid_code" : "invalid_token";
  }
  if (status === 400) {
    if (url.includes("/mfa/")) return "invalid_code";
    if (url.endsWith("/verify-email") || url.endsWith("/reset-password"))
      return "invalid_token";
  }
  return "unknown";
}

/** Reads the wait from the body's `retryAfter`, falling back to the `Retry-After` header. */
function parseRetryAfter(fromBody: unknown, fromHeader: unknown): number {
  const seconds = Number(fromBody ?? fromHeader);
  return Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : 0;
}

function toAuthApiError(error: unknown): AuthApiError {
  if (error instanceof AuthApiError) return error;
  if (!axios.isAxiosError(error) || !error.response) {
    return new AuthApiError("network");
  }
  const { status, data } = error.response;
  const body = (typeof data === "object" && data ? data : {}) as ErrorBody;
  const code =
    body.code && AUTH_ERROR_CODES.includes(body.code)
      ? (body.code as AuthErrorCode)
      : codeFromStatus(status, error.config?.url);
  return new AuthApiError(
    code,
    status,
    body.errors,
    status === 429
      ? parseRetryAfter(body.retryAfter, error.response.headers["retry-after"])
      : undefined,
    typeof body.message === "string" ? body.message : undefined,
  );
}

async function call<T>(request: Promise<AxiosResponse<T>>): Promise<T> {
  try {
    return (await request).data;
  } catch (error) {
    throw toAuthApiError(error);
  }
}

/* -------------------------------------------------------------------------- */
/* Axios instances                                                            */
/* -------------------------------------------------------------------------- */

const clientConfig = {
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
};

/** Authenticated client: attaches the access token and renews it on 401. */
export const api = axios.create(clientConfig);

/**
 * Client without interceptors for `refresh` and `logout`, so a 401 on those
 * calls can never trigger another refresh.
 */
const plainApi = axios.create(clientConfig);

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.set("Authorization", `Bearer ${accessToken}`);
  return config;
});

let refreshInFlight: Promise<string> | undefined;

/**
 * Exchanges the stored refresh token for a new access token. Calls made while
 * one is already running share its result: with a rotating refresh token a
 * second concurrent call would be rejected and end the session.
 */
export function refreshSession(): Promise<string> {
  refreshInFlight ??= (async () => {
    const refreshToken = readRefreshToken();
    if (!refreshToken) throw new AuthApiError("invalid_token", 401);
    try {
      const { data } = await plainApi.post<AuthTokens>("/auth/refresh", {
        refreshToken,
      });
      setTokens(data.accessToken, data.refreshToken ?? refreshToken);
      return data.accessToken;
    } catch (error) {
      const authError = toAuthApiError(error);
      // Only a rejection ends the session; an outage keeps the token for later.
      if (authError.code !== "network" && authError.status < 500) {
        clearTokens();
      }
      throw authError;
    }
  })().finally(() => {
    refreshInFlight = undefined;
  });
  return refreshInFlight;
}

interface RetriableRequest extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

interface QueuedRequest {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}

let isRefreshing = false;
let failedQueue: QueuedRequest[] = [];

function flushQueue(error: unknown, token?: string) {
  for (const queued of failedQueue) {
    if (token) queued.resolve(token);
    else queued.reject(error);
  }
  failedQueue = [];
}

function isSessionRejection(error: AuthApiError) {
  return error.code !== "network" && error.status < 500;
}

api.interceptors.response.use(undefined, async (error: unknown) => {
  if (!axios.isAxiosError(error) || !error.config) throw error;

  const request = error.config as RetriableRequest;
  const { status, data } = error.response ?? {};

  if (
    status === 403 &&
    (data as ErrorBody | undefined)?.code === "account_suspended"
  ) {
    sessionHandlers.onAccountSuspended?.();
    throw error;
  }

  // Requests sent without a token (login, register...) have nothing to renew.
  if (
    status !== 401 ||
    request._retry ||
    !request.headers.has("Authorization")
  ) {
    throw error;
  }
  request._retry = true;

  if (isRefreshing) {
    // A refresh is already running: wait for its token instead of starting another.
    const token = await new Promise<string>((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    });
    request.headers.set("Authorization", `Bearer ${token}`);
    return api(request);
  }

  isRefreshing = true;
  try {
    const token = await refreshSession();
    flushQueue(null, token);
    request.headers.set("Authorization", `Bearer ${token}`);
    return await api(request);
  } catch (refreshError) {
    const authError = toAuthApiError(refreshError);
    flushQueue(authError);
    if (isSessionRejection(authError)) {
      clearTokens();
      sessionHandlers.onSessionExpired?.();
    }
    throw authError;
  } finally {
    isRefreshing = false;
  }
});

/* -------------------------------------------------------------------------- */
/* API functions                                                              */
/* -------------------------------------------------------------------------- */

type LoginResponse = AuthTokens | { mfaRequired: true; mfaToken: string };

function toLoginResult(data: LoginResponse): LoginResult {
  if ("mfaRequired" in data && data.mfaRequired) {
    return { status: "mfa_required", mfaToken: data.mfaToken };
  }
  return { status: "authenticated", tokens: data as AuthTokens };
}

export const loginApi = async (
  email: string,
  password: string,
  rememberMe = false,
  recaptchaToken = "",
): Promise<LoginResult> =>
  toLoginResult(
    await call(
      api.post<LoginResponse>("/auth/login", {
        email,
        password,
        rememberMe,
        ...(recaptchaToken && { recaptchaToken }),
      }),
    ),
  );

export const registerApi = (
  name: string,
  email: string,
  password: string,
  recaptchaToken = "",
) =>
  call(
    api.post<unknown>("/auth/register", {
      name,
      email,
      password,
      ...(recaptchaToken && { recaptchaToken }),
    }),
  );

export const refreshApi = (refreshToken: string) =>
  call(plainApi.post<AuthTokens>("/auth/refresh", { refreshToken }));

export const logoutApi = (refreshToken: string) =>
  call(
    plainApi.post<unknown>(
      "/auth/logout",
      { refreshToken },
      accessToken
        ? { headers: { Authorization: `Bearer ${accessToken}` } }
        : undefined,
    ),
  );

export const getMeApi = () => call(api.get<User>("/auth/me"));

export const verifyMfaApi = async (values: {
  mfaToken: string;
  code: string;
  isBackupCode: boolean;
}): Promise<AuthTokens> =>
  call(api.post<AuthTokens>("/auth/mfa/verify", values));

/** Endpoints that need no session; screens call them directly. */
export const authApi = {
  verifyEmail: (token: string) =>
    call(api.post<unknown>("/auth/verify-email", { token })),
  resendVerification: (email: string) =>
    call(api.post<unknown>("/auth/resend-verification", { email })),
  requestPasswordReset: (email: string) =>
    call(api.post<unknown>("/auth/forgot-password", { email })),
  resetPassword: (values: { token: string; password: string }) =>
    call(api.post<unknown>("/auth/reset-password", values)),
};
