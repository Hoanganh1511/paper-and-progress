import { AuthGate } from "@/features/auth";

/** Everything in the app needs a signed-in user; visitors are sent to `/login`. */
export default function ApplicationLayout({ children }: LayoutProps<"/">) {
  return <AuthGate>{children}</AuthGate>;
}
