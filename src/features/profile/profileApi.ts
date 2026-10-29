import axios from "axios";
import { authedApi } from "@/features/auth";

export type ThemeChoice = "light" | "dark" | "system";
export type LocaleChoice = "vi" | "en";

export interface UserProfile {
  email: string;
  displayName: string | null;
  bio: string | null;
  phone: string | null;
  /** Public URL of the uploaded picture, or null for the initial-letter placeholder. */
  avatarUrl: string | null;
  timezone: string;
  locale: LocaleChoice;
  theme: ThemeChoice;
}

/** Fields the profile form and the preference buttons can change. Null clears a value. */
export interface ProfilePatch {
  displayName?: string | null;
  bio?: string | null;
  phone?: string | null;
  theme?: ThemeChoice;
  locale?: LocaleChoice;
}

export interface PasswordChange {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/** A failed profile call, carrying the message the backend wrote (already Vietnamese). */
export class ProfileApiError extends Error {
  readonly status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.name = "ProfileApiError";
    this.status = status;
  }
}

const NETWORK_MESSAGE = "Không kết nối được máy chủ. Thử lại sau.";
const UNKNOWN_MESSAGE = "Có lỗi xảy ra. Thử lại sau.";

function toProfileApiError(error: unknown): ProfileApiError {
  if (!axios.isAxiosError(error)) return new ProfileApiError(UNKNOWN_MESSAGE);
  if (!error.response) return new ProfileApiError(NETWORK_MESSAGE);
  const { status, data } = error.response;
  // Nest sends `message` as a string, or as a list when validation failed.
  const raw = (data as { message?: unknown } | undefined)?.message;
  const message = Array.isArray(raw)
    ? raw.map(String).join(" ")
    : typeof raw === "string"
      ? raw
      : UNKNOWN_MESSAGE;
  return new ProfileApiError(message, status);
}

async function call<T>(request: Promise<{ data: T }>): Promise<T> {
  try {
    return (await request).data;
  } catch (error) {
    throw toProfileApiError(error);
  }
}

/** The backend calls the picture `avatarBase64` for historical reasons; it now holds a URL. */
interface ProfileResponse extends Omit<UserProfile, "avatarUrl"> {
  avatarBase64: string | null;
}

function toUserProfile({
  avatarBase64,
  ...rest
}: ProfileResponse): UserProfile {
  return { ...rest, avatarUrl: avatarBase64 };
}

export async function getProfile(): Promise<UserProfile> {
  return toUserProfile(
    await call(authedApi.get<ProfileResponse>("/users/me/profile")),
  );
}

export async function updateProfile(patch: ProfilePatch): Promise<UserProfile> {
  return toUserProfile(
    await call(authedApi.patch<ProfileResponse>("/users/me/profile", patch)),
  );
}

/** Sends the picture as multipart `avatar`; resolves with the new public URL. */
export async function uploadAvatar(file: File): Promise<string> {
  const body = new FormData();
  body.append("avatar", file);
  const { avatarUrl } = await call(
    // Leaving Content-Type unset lets the browser add the multipart boundary.
    authedApi.post<{ avatarUrl: string }>("/users/me/avatar", body, {
      headers: { "Content-Type": undefined },
    }),
  );
  return avatarUrl;
}

export async function deleteAvatar(): Promise<void> {
  await call(authedApi.delete("/users/me/avatar"));
}

export async function changePassword(values: PasswordChange): Promise<void> {
  await call(authedApi.post("/users/me/change-password", values));
}

export async function deleteAccount(): Promise<void> {
  await call(authedApi.delete("/users/me"));
}
