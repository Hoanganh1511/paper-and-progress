import type { Metadata } from "next";
import { MfaChallengeScreen } from "@/features/auth/screens";

export const metadata: Metadata = {
  title: "Xác thực hai bước - Paper & Progress",
  robots: { index: false },
};

export default function Page() {
  return <MfaChallengeScreen />;
}
