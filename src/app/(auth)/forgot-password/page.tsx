import type { Metadata } from "next";
import { ForgotPasswordScreen } from "@/features/auth/screens";

export const metadata: Metadata = {
  title: "Quên mật khẩu - Paper & Progress",
  robots: { index: false },
};

export default function Page() {
  return <ForgotPasswordScreen />;
}
