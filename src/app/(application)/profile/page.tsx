import type { Metadata } from "next";
import { ProfileScreen } from "@/features/profile";

export const metadata: Metadata = {
  title: "Hồ sơ cá nhân - Paper & Progress",
  description: "Xem thông tin cá nhân, thành tích và tiến độ học của bạn.",
};

export default function ProfilePage() {
  return (
    <main id="main-content" tabIndex={-1} lang="vi" className="outline-none">
      <ProfileScreen />
    </main>
  );
}
