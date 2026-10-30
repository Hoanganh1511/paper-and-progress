import axios from "axios";
import { authedApi } from "@/features/auth";
import { ProfileApiError } from "./profileApi";

export interface TotpSetup {
  /** The `otpauth://` URI the authenticator app reads from the QR code. */
  otpauthUri: string;
  /** The same secret as text, for typing in by hand. */
  secret?: string;
}

interface SetupResponse {
  otpauthUri?: string;
  otpauthUrl?: string;
  uri?: string;
  secret?: string;
}

const UNKNOWN_MESSAGE = "Có lỗi xảy ra. Thử lại sau.";

function toError(error: unknown): ProfileApiError {
  if (!axios.isAxiosError(error) || !error.response) {
    return new ProfileApiError("Không kết nối được máy chủ. Thử lại sau.");
  }
  const { status, data } = error.response;
  // The backend words these in Vietnamese ("Mật khẩu không đúng.", "Mã không đúng.").
  const raw = (data as { message?: unknown } | undefined)?.message;
  const message = Array.isArray(raw)
    ? raw.map(String).join(" ")
    : typeof raw === "string"
      ? raw
      : status === 400 || status === 401
        ? "Mã không đúng. Kiểm tra lại và thử lần nữa."
        : UNKNOWN_MESSAGE;
  return new ProfileApiError(message, status);
}

async function call<T>(request: Promise<{ data: T }>): Promise<T> {
  try {
    return (await request).data;
  } catch (error) {
    throw toError(error);
  }
}

/** Whether 2FA is on, from `/auth/totp/status` (a bare boolean, or an object that holds one). */
export async function getTotpEnabled(): Promise<boolean> {
  const data = await call(
    authedApi.get<boolean | Record<string, unknown>>("/auth/totp/status"),
  );
  if (typeof data === "boolean") return data;
  return [
    data?.enabled,
    data?.isEnabled,
    data?.totpEnabled,
    data?.mfaEnabled,
  ].some((value) => value === true);
}

export async function setupTotp(): Promise<TotpSetup> {
  const data = await call(authedApi.post<SetupResponse>("/auth/totp/setup"));
  const otpauthUri = data.otpauthUri ?? data.otpauthUrl ?? data.uri;
  if (!otpauthUri) throw new ProfileApiError(UNKNOWN_MESSAGE);
  return { otpauthUri, secret: data.secret };
}

/** Confirms the first code; resolves with the one-time recovery codes. */
export async function enableTotp(code: string): Promise<string[]> {
  const data = await call(
    authedApi.post<{ recoveryCodes: string[] }>("/auth/totp/enable", { code }),
  );
  return data.recoveryCodes;
}

/** `password` is required for an account that has one; social-only accounts leave it out. */
export async function disableTotp(
  code: string,
  password?: string,
): Promise<void> {
  await call(
    authedApi.post("/auth/totp/disable", {
      code,
      ...(password && { password }),
    }),
  );
}

export async function regenerateRecoveryCodes(code: string): Promise<string[]> {
  const data = await call(
    authedApi.post<{ recoveryCodes: string[] }>("/auth/totp/recovery-codes", {
      code,
    }),
  );
  return data.recoveryCodes;
}
