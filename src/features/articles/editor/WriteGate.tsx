"use client";

import type { ReactNode } from "react";
import { Alert, Skeleton } from "@/design-system";
import { useAuth } from "@/features/auth";

/** Only authors (CREATOR) and admins may write; everyone else sees why they cannot. */
export function WriteGate({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <Skeleton className="h-24 w-full" />;
  if (user?.role !== "CREATOR" && user?.role !== "ADMIN") {
    return (
      <Alert variant="warning" title="Bạn chưa có quyền viết bài">
        Chỉ tác giả và quản trị viên mới viết được bài. Liên hệ quản trị viên
        nếu bạn muốn trở thành tác giả.
      </Alert>
    );
  }
  return children;
}
