import type { Metadata } from "next";
import { ResetPasswordScreen } from "@/features/auth/screens";

export const metadata: Metadata = {
  title: "Đặt lại mật khẩu - Paper & Progress",
  robots: { index: false },
};

export default function Page() {
  return <ResetPasswordScreen />;
}
