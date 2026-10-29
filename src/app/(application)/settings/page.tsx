import type { Metadata } from "next";
import { SettingsScreen } from "@/features/profile";

export const metadata: Metadata = {
  title: "Cài đặt tài khoản - Paper & Progress",
  description:
    "Chỉnh sửa hồ sơ, đổi mật khẩu, chọn giao diện và ngôn ngữ, quản lý tài khoản liên kết và gói thanh toán.",
};

export default function SettingsPage() {
  return (
    <main id="main-content" tabIndex={-1} lang="vi" className="outline-none">
      <SettingsScreen />
    </main>
  );
}
