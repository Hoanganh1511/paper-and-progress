import type { Metadata } from "next";
import { RegisterScreen } from "@/features/auth/screens";

export const metadata: Metadata = {
  title: "Đăng ký - Paper & Progress",
  robots: { index: false },
};

export default function Page() {
  return <RegisterScreen />;
}
