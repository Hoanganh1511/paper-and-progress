import type { Metadata } from "next";
import { LoginScreen } from "@/features/auth/screens";

export const metadata: Metadata = {
  title: "Đăng nhập - Paper & Progress",
  robots: { index: false },
};

export default function Page() {
  return <LoginScreen />;
}
