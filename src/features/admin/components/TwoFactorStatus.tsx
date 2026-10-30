import { cn } from "@/design-system";

/** Bold text only: "ON" in the green success colour, "OFF" in the normal text colour. */
export function TwoFactorStatus({ isEnabled }: { isEnabled: boolean }) {
  return (
    <span
      className={cn(
        "font-display text-body-md font-extrabold tracking-wide",
        isEnabled ? "text-success-text" : "text-text-primary",
      )}
    >
      {isEnabled ? "ON" : "OFF"}
    </span>
  );
}
