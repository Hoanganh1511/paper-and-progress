import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminGate } from "@/features/admin";

export const metadata: Metadata = {
  title: "Project Dashboard - Paper & Progress",
  robots: { index: false },
};

/** The project dashboard is for admins only; anyone else is sent home. */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AdminGate>
      <main id="main-content" tabIndex={-1} lang="vi" className="outline-none">
        {children}
      </main>
    </AdminGate>
  );
}
