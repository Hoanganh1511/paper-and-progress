import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { vi } from "vitest";
import { ProfileApiError, type UserProfile } from "../profileApi";
import { EditProfileTab } from "./EditProfileTab";

expect.extend(toHaveNoViolations);

const profile: UserProfile = {
  email: "an@example.com",
  displayName: "An",
  bio: "Xin chào",
  phone: "0901234567",
  avatarUrl: null,
  timezone: "Asia/Ho_Chi_Minh",
  locale: "vi",
  theme: "system",
};

function setup(overrides: Partial<UserProfile> = {}) {
  const props = {
    profile: { ...profile, ...overrides },
    fallbackName: "Nguyễn An",
    onSave: vi.fn().mockResolvedValue(undefined),
    onUploadAvatar: vi.fn().mockResolvedValue(undefined),
    onRemoveAvatar: vi.fn().mockResolvedValue(undefined),
  };
  const { container } = render(<EditProfileTab {...props} />);
  return { ...props, container };
}

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => "blob:preview");
  URL.revokeObjectURL = vi.fn();
});

describe("EditProfileTab form", () => {
  it("saves the edited fields", async () => {
    const { onSave } = setup();
    const name = screen.getByLabelText("Tên hiển thị");
    await userEvent.clear(name);
    await userEvent.type(name, "An Mới");
    await userEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));
    expect(onSave).toHaveBeenCalledWith({
      displayName: "An Mới",
      bio: "Xin chào",
      phone: "0901234567",
    });
    expect(await screen.findByText("Đã lưu thay đổi.")).toBeInTheDocument();
  });

  it("sends null for fields the user emptied", async () => {
    const { onSave } = setup();
    await userEvent.clear(screen.getByLabelText("Số điện thoại"));
    await userEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ phone: null }),
    );
  });

  it("rejects an invalid phone without calling the API", async () => {
    const { onSave } = setup();
    const phone = screen.getByLabelText("Số điện thoại");
    await userEvent.clear(phone);
    await userEvent.type(phone, "abc");
    await userEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));
    expect(screen.getByText("Số điện thoại không hợp lệ.")).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("shows the backend message when saving fails", async () => {
    const { onSave } = setup();
    onSave.mockRejectedValueOnce(
      new ProfileApiError("Số điện thoại không hợp lệ", 400),
    );
    await userEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Số điện thoại không hợp lệ",
    );
  });

  it("has no accessibility violations", async () => {
    const { container } = setup();
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("avatar", () => {
  const file = (name: string, type: string, size = 100) => {
    const f = new File(["x"], name, { type });
    Object.defineProperty(f, "size", { value: size });
    return f;
  };
  const input = () =>
    document.querySelector<HTMLInputElement>('input[type="file"]')!;

  it("opens the file picker when the picture is clicked", async () => {
    setup();
    const click = vi.spyOn(input(), "click");
    await userEvent.click(
      screen.getByRole("button", { name: "Chọn ảnh đại diện" }),
    );
    expect(click).toHaveBeenCalled();
  });

  it("previews the chosen picture and uploads it only on request", async () => {
    const { onUploadAvatar } = setup();
    const picked = file("me.png", "image/png");
    await userEvent.upload(input(), picked);
    expect(onUploadAvatar).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Tải lên" }));
    expect(onUploadAvatar).toHaveBeenCalledWith(picked);
    expect(
      await screen.findByText("Đã cập nhật ảnh đại diện."),
    ).toBeInTheDocument();
  });

  it("lets the user cancel a preview", async () => {
    const { onUploadAvatar } = setup();
    await userEvent.upload(input(), file("me.png", "image/png"));
    await userEvent.click(screen.getByRole("button", { name: "Huỷ" }));
    expect(screen.queryByRole("button", { name: "Tải lên" })).toBeNull();
    expect(onUploadAvatar).not.toHaveBeenCalled();
  });

  it("rejects the wrong type and files over 2MB", async () => {
    setup();
    // applyAccept: false, so the accept filter does not hide the wrong type.
    const user = userEvent.setup({ applyAccept: false });
    await user.upload(input(), file("a.gif", "image/gif"));
    expect(
      screen.getByText("Chỉ chấp nhận ảnh JPEG, PNG hoặc WebP."),
    ).toBeInTheDocument();
    await user.upload(input(), file("big.png", "image/png", 3 * 1024 * 1024));
    expect(screen.getByText("Ảnh tối đa 2MB.")).toBeInTheDocument();
  });

  it("shows the backend message when the upload fails", async () => {
    const { onUploadAvatar } = setup();
    onUploadAvatar.mockRejectedValueOnce(
      new ProfileApiError("Upload ảnh thất bại", 500),
    );
    await userEvent.upload(input(), file("me.png", "image/png"));
    await userEvent.click(screen.getByRole("button", { name: "Tải lên" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Upload ảnh thất bại",
    );
  });

  it("removes an existing picture", async () => {
    const { onRemoveAvatar } = setup({ avatarUrl: "https://x/a.webp" });
    await userEvent.click(screen.getByRole("button", { name: "Xoá ảnh" }));
    await waitFor(() => expect(onRemoveAvatar).toHaveBeenCalled());
    expect(await screen.findByText("Đã xoá ảnh đại diện.")).toBeInTheDocument();
  });

  it("offers no remove button without a picture", () => {
    setup({ avatarUrl: null });
    expect(screen.queryByRole("button", { name: "Xoá ảnh" })).toBeNull();
  });
});
