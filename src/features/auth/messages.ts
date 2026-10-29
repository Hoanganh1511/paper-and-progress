import { AuthApiError, type AuthErrorCode } from "./authApi";

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
  validation: "Thông tin chưa hợp lệ. Hãy kiểm tra lại các ô đã nhập.",
  network: "Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.",
  unknown: "Đã có lỗi xảy ra. Vui lòng thử lại.",
};

/**
 * Why a Google / Facebook / GitHub sign-in ended on `/auth/callback`. The
 * backend puts a code in `?error=`; only the codes listed here become text, so
 * the address cannot be used to show arbitrary words (or internal error
 * messages) to a visitor. Anything else gets `default`.
 */
export const SOCIAL_CALLBACK_ERRORS: Record<string, string> = {
  EMAIL_REQUIRED:
    "Tài khoản này không chia sẻ địa chỉ email, nên không thể đăng nhập. Hãy cho phép chia sẻ email hoặc dùng cách đăng nhập khác.",
  ACCOUNT_DISABLED: "Tài khoản đã bị khoá. Vui lòng liên hệ admin.",
  missing_tokens: "Không nhận được thông tin đăng nhập. Hãy thử đăng nhập lại.",
  default: "Đăng nhập không thành công. Vui lòng thử lại.",
};

/**
 * The text to show for a failed auth call. When the backend rejected the input
 * and said which rule was broken (e.g. "Mật khẩu phải có chữ hoa, chữ thường và
 * số"), that sentence is shown as written; every other failure gets the fixed
 * text for its code, so internal errors never reach the screen.
 */
export function describeAuthError(caught: unknown): string {
  if (caught instanceof AuthApiError) {
    if (caught.code === "validation" && caught.serverMessage) {
      return caught.serverMessage;
    }
    return AUTH_ERROR_MESSAGES[caught.code];
  }
  return AUTH_ERROR_MESSAGES.unknown;
}
