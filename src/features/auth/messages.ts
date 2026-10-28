import type { AuthErrorCode } from "./authApi";

/** Shown on a 429 while the retry countdown runs. */
export const rateLimitedMessage = (seconds: number) =>
  `Vui lòng đợi ${seconds} giây rồi thử lại.`;

/** Vietnamese text for each backend error, shown as a form-level error. */
export const AUTH_ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  invalid_credentials: "Email hoặc mật khẩu không đúng.",
  email_taken: "Email này đã được đăng ký.",
  email_not_verified: "Email chưa được xác minh. Hãy kiểm tra hộp thư của bạn.",
  invalid_token: "Liên kết không hợp lệ hoặc đã hết hạn.",
  invalid_code: "Mã không đúng hoặc đã hết hạn.",
  rate_limited: "Bạn thử quá nhiều lần. Vui lòng đợi một lúc rồi thử lại.",
  account_suspended: "Tài khoản đã bị khoá. Vui lòng liên hệ admin.",
  network: "Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.",
  unknown: "Đã có lỗi xảy ra. Vui lòng thử lại.",
};
