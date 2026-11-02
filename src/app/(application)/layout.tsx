import { Suspense } from "react";
import { AuthGate, AuthSplash } from "@/features/auth";

/**
 * Everything in the app needs a signed-in user; visitors are sent to `/login`
 * and come back to the page they asked for. The gate reads the current path for
 * that, which a dynamic route only knows at request time, so it streams in
 * behind the splash.
 */
export default function ApplicationLayout({ children }: LayoutProps<"/">) {
  return (
    <Suspense fallback={<AuthSplash />}>
      <AuthGate>{children}</AuthGate>
    </Suspense>
  );
}
