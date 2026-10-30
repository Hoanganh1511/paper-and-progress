import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { AdminGate, AdminShell } from "@/features/admin";

export const metadata: Metadata = {
  title: "Admin - Paper & Progress",
  robots: { index: false },
};

/** The admin area: its own sidebar, and only for the `ADMIN` role. */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminGate>
      <main id="main-content" tabIndex={-1} lang="vi" className="outline-none">
        <Suspense>
          <AdminShell>{children}</AdminShell>
        </Suspense>
      </main>
    </AdminGate>
  );
}
