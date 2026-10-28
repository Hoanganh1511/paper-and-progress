import type { Metadata } from "next";
import { AccountSuspendedScreen } from "@/features/auth/screens";

export const metadata: Metadata = {
  title: "Tài khoản bị khoá - Paper & Progress",
  robots: { index: false },
};

export default function Page() {
  return <AccountSuspendedScreen />;
}
