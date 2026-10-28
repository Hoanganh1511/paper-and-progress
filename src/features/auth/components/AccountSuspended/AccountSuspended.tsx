import { type ReactNode } from "react";
import { ShieldAlert } from "lucide-react";
import { Button, EmptyState, type EmptyStateProps } from "@/design-system";

export interface AccountSuspendedProps extends Omit<
  EmptyStateProps,
  "icon" | "title" | "description" | "action" | "role"
> {
  title?: ReactNode;
  description?: ReactNode;
  /** Called by the sign-out button. */
  onLogout: () => void;
  logoutLabel?: string;
}

/** Tells the user their account is locked; the only way forward is to sign out. */
export function AccountSuspended({
  title = "Tài khoản đã bị khoá",
  description = "Tài khoản của bạn hiện không thể sử dụng. Vui lòng liên hệ admin để được hỗ trợ.",
  onLogout,
  logoutLabel = "Đăng xuất",
  titleAs = "h1",
  ...props
}: AccountSuspendedProps) {
  return (
    <EmptyState
      role="alert"
      icon={ShieldAlert}
      title={title}
      titleAs={titleAs}
      description={description}
      action={
        <Button size="comfortable" onClick={onLogout}>
          {logoutLabel}
        </Button>
      }
      {...props}
    />
  );
}
