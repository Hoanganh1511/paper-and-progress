import type { Metadata } from "next";
import { VerifyEmailScreen } from "@/features/auth/screens";

export const metadata: Metadata = {
  title: "Xác minh email - Paper & Progress",
  robots: { index: false },
};

export default function Page() {
  return <VerifyEmailScreen />;
}
