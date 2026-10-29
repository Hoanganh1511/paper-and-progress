import type { Metadata } from "next";
import { ProfileScreen } from "@/features/profile";

export const metadata: Metadata = {
  title: "Hồ sơ cá nhân - Paper & Progress",
  description:
    "Quản lý thông tin cá nhân, bảo mật, tùy chọn, gói thanh toán và theo dõi tiến độ học của bạn.",
};

export default function ProfilePage() {
  return (
    <main id="main-content" tabIndex={-1} lang="vi" className="outline-none">
      <ProfileScreen />
    </main>
  );
}
