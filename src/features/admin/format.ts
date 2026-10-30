import type { SecurityEventType } from "./adminApi";

export const PAGE_SIZE = 20;

const dateTime = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short",
  timeStyle: "short",
});
const date = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short" });

export const formatDateTime = (iso: string) => dateTime.format(new Date(iso));
export const formatDate = (iso: string) => date.format(new Date(iso));

/** "2026-10-30" -> "30/10". */
export function formatDayLabel(day: string) {
  const [, month, dayOfMonth] = day.split("-");
  return `${dayOfMonth}/${month}`;
}

export const pageCountOf = (total: number, limit = PAGE_SIZE) =>
  Math.max(1, Math.ceil(total / limit));

/** Start of the picked day in local time, as the ISO string the API takes. */
export const startOfDayIso = (day: string) =>
  day ? new Date(`${day}T00:00:00`).toISOString() : undefined;

export const endOfDayIso = (day: string) =>
  day ? new Date(`${day}T23:59:59.999`).toISOString() : undefined;

export const EVENT_LABELS: Record<SecurityEventType, string> = {
  RECAPTCHA_REJECT: "reCAPTCHA bị từ chối",
  HIBP_BLOCK: "Mật khẩu bị rò rỉ",
  TOTP_FAIL: "Sai mã 2FA",
  RECOVERY_USED: "Dùng mã khôi phục",
  ANOMALY_ALERT: "IP lạ",
};
