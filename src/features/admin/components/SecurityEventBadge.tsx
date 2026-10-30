import { Badge, type BadgeProps } from "@/design-system";
import type { SecurityEventType } from "../adminApi";

/** Colour by severity; the text always names the type, so colour is never the only cue. */
const VARIANTS: Record<SecurityEventType, BadgeProps["variant"]> = {
  TOTP_FAIL: "danger",
  RECAPTCHA_REJECT: "warning",
  ANOMALY_ALERT: "pink",
  HIBP_BLOCK: "blue",
  RECOVERY_USED: "default",
};

export function SecurityEventBadge({ type }: { type: SecurityEventType }) {
  return (
    <Badge variant={VARIANTS[type] ?? "default"} size="sm">
      {type}
    </Badge>
  );
}
