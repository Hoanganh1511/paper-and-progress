import { AxiosError, type AxiosResponse } from "axios";
import { vi } from "vitest";

const http = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}));
vi.mock("@/features/auth", () => ({ authedApi: http }));

import {
  ProfileApiError,
  changePassword,
  deleteAccount,
  deleteAvatar,
  getProfile,
  updateProfile,
  uploadAvatar,
} from "./profileApi";

const RAW = {
  email: "an@example.com",
  displayName: "An",
  bio: null,
  phone: null,
  avatarBase64: "https://cdn.example.com/a.webp",
  timezone: "Asia/Ho_Chi_Minh",
  locale: "vi",
  theme: "system",
};

function httpError(status: number, data: unknown) {
  return new AxiosError("x", "ERR", undefined, undefined, {
    status,
    data,
  } as AxiosResponse);
}

beforeEach(() => vi.clearAllMocks());

describe("profileApi", () => {
  it("loads the profile and renames avatarBase64 to avatarUrl", async () => {
    http.get.mockResolvedValue({ data: RAW });
    const profile = await getProfile();
    expect(http.get).toHaveBeenCalledWith("/users/me/profile");
    expect(profile.avatarUrl).toBe("https://cdn.example.com/a.webp");
    expect(profile).not.toHaveProperty("avatarBase64");
  });

  it("patches only the given fields", async () => {
    http.patch.mockResolvedValue({ data: { ...RAW, theme: "dark" } });
    const profile = await updateProfile({ theme: "dark" });
    expect(http.patch).toHaveBeenCalledWith("/users/me/profile", {
      theme: "dark",
    });
    expect(profile.theme).toBe("dark");
  });

  it("uploads the picture as multipart field `avatar`", async () => {
    http.post.mockResolvedValue({ data: { avatarUrl: "https://x/y.webp" } });
    const file = new File(["img"], "me.png", { type: "image/png" });
    await expect(uploadAvatar(file)).resolves.toBe("https://x/y.webp");
    const [path, body] = http.post.mock.calls[0];
    expect(path).toBe("/users/me/avatar");
    expect((body as FormData).get("avatar")).toBeInstanceOf(File);
  });

  it("calls the remaining endpoints", async () => {
    http.delete.mockResolvedValue({ data: undefined });
    http.post.mockResolvedValue({ data: { message: "ok" } });
    const values = {
      currentPassword: "Old12345",
      newPassword: "New12345",
      confirmPassword: "New12345",
    };
    await changePassword(values);
    expect(http.post).toHaveBeenCalledWith("/users/me/change-password", values);
    await deleteAvatar();
    expect(http.delete).toHaveBeenCalledWith("/users/me/avatar");
    await deleteAccount();
    expect(http.delete).toHaveBeenCalledWith("/users/me");
  });

  it("surfaces the backend message, joining validation lists", async () => {
    http.post.mockRejectedValueOnce(
      httpError(400, { message: "Mật khẩu hiện tại không đúng" }),
    );
    await expect(
      changePassword({
        currentPassword: "x",
        newPassword: "y",
        confirmPassword: "y",
      }),
    ).rejects.toMatchObject({
      name: "ProfileApiError",
      status: 400,
      message: "Mật khẩu hiện tại không đúng",
    });

    http.patch.mockRejectedValueOnce(
      httpError(400, { message: ["a sai", "b sai"] }),
    );
    await expect(updateProfile({ phone: "1" })).rejects.toThrow("a sai b sai");
  });

  it("reports an unreachable server", async () => {
    http.get.mockRejectedValue(new AxiosError("Network Error"));
    await expect(getProfile()).rejects.toBeInstanceOf(ProfileApiError);
    await expect(getProfile()).rejects.toMatchObject({ status: 0 });
  });
});
