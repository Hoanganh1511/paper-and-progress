import { type ComponentProps } from "react";
import { Spinner, cn } from "@/design-system";

export interface AuthSplashProps extends ComponentProps<"div"> {
  label?: string;
}

/** Full-area loading screen shown while the app checks for an existing session. */
export function AuthSplash({
  label = "Đang kiểm tra phiên đăng nhập…",
  className,
  ...props
}: AuthSplashProps) {
  return (
    <div
      className={cn(
        "flex min-h-[50dvh] flex-col items-center justify-center gap-3 font-body text-body-md text-text-secondary",
        className,
      )}
      {...props}
    >
      <Spinner size="lg" label={label} />
      <span aria-hidden="true">{label}</span>
    </div>
  );
}
