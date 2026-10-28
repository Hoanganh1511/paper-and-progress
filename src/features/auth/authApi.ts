const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const AUTH_PATH = `${API_URL}/api/v1/auth`;

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

export class AuthApiError extends Error {
  readonly code: AuthErrorCode;
  readonly status: number;
  /** Per-field messages when the backend rejected a specific input. */
  readonly fieldErrors: Record<string, string>;

  constructor(
    code: AuthErrorCode,
    status = 0,
    fieldErrors: Record<string, string> = {},
  ) {
    super(code);
    this.name = "AuthApiError";
    this.code = code;
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export type LoginResult =
  | { status: "authenticated" }
  /** 2FA is on: send the user to `/mfa-challenge` with this ticket. */
  | { status: "mfa_required"; mfaToken: string };

async function post<T = unknown>(path: string, body: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${AUTH_PATH}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
  } catch {
    throw new AuthApiError("network");
  }

  const data = (await response.json().catch(() => ({}))) as {
    code?: AuthErrorCode;
    errors?: Record<string, string>;
  };
  if (!response.ok) {
    throw new AuthApiError(
      data.code ?? (response.status === 429 ? "rate_limited" : "unknown"),
      response.status,
      data.errors,
    );
  }
  return data as T;
}

export const authApi = {
  login: (values: { email: string; password: string; rememberMe: boolean }) =>
    post<LoginResult>("/login", values),
  register: (values: { name: string; email: string; password: string }) =>
    post("/register", values),
  verifyEmail: (token: string) => post("/verify-email", { token }),
  resendVerification: (email: string) =>
    post("/resend-verification", { email }),
  requestPasswordReset: (email: string) => post("/forgot-password", { email }),
  resetPassword: (values: { token: string; password: string }) =>
    post("/reset-password", values),
  verifyMfa: (values: {
    mfaToken: string;
    code: string;
    isBackupCode: boolean;
  }) => post("/mfa/verify", values),
};
