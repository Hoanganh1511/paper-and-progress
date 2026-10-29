import type { Metadata } from "next";
import { SocialCallbackScreen } from "@/features/auth/screens";

export const metadata: Metadata = {
  title: "Đang đăng nhập - Paper & Progress",
  robots: { index: false },
};

export default function Page() {
  return <SocialCallbackScreen />;
}
