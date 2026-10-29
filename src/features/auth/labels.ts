import type { ComponentProps } from "react";
import type { ForgotPasswordForm, LoginForm, RegisterForm } from "./components";

/** Vietnamese texts for the shared auth forms, which default to English. */
export const loginLabels: ComponentProps<typeof LoginForm>["labels"] = {
  title: "Đăng nhập",
  description: "Chào mừng quay lại. Nhập thông tin để tiếp tục.",
  email: "Email",
  password: "Mật khẩu",
  rememberMe: "Ghi nhớ đăng nhập",
  forgotPassword: "Quên mật khẩu?",
  submit: "Đăng nhập",
  noAccount: "Chưa có tài khoản?",
  signUp: "Đăng ký",
  emailRequired: "Nhập email của bạn.",
  emailInvalid: "Email không hợp lệ.",
  passwordRequired: "Nhập mật khẩu.",
};

export const registerLabels: ComponentProps<typeof RegisterForm>["labels"] = {
  title: "Tạo tài khoản",
  description: "Chỉ mất một phút để bắt đầu.",
  name: "Họ và tên",
  email: "Email",
  password: "Mật khẩu",
  passwordHint: "Ít nhất {min} ký tự.",
  confirmPassword: "Nhập lại mật khẩu",
  acceptTerms: "Tôi đồng ý với Điều khoản sử dụng và Chính sách bảo mật",
  submit: "Đăng ký",
  haveAccount: "Đã có tài khoản?",
  signIn: "Đăng nhập",
  nameRequired: "Nhập họ và tên.",
  emailRequired: "Nhập email của bạn.",
  emailInvalid: "Email không hợp lệ.",
  passwordRequired: "Chọn một mật khẩu.",
  passwordTooShort: "Dùng ít nhất {min} ký tự.",
  confirmPasswordRequired: "Nhập lại mật khẩu.",
  passwordMismatch: "Hai mật khẩu không khớp.",
  termsRequired: "Bạn cần đồng ý với điều khoản để tiếp tục.",
};

export const forgotPasswordLabels: ComponentProps<
  typeof ForgotPasswordForm
>["labels"] = {
  title: "Quên mật khẩu?",
  description: "Nhập email, chúng tôi sẽ gửi link để đặt lại mật khẩu.",
  email: "Email",
  submit: "Gửi link đặt lại mật khẩu",
  backToSignIn: "Quay lại đăng nhập",
  emailRequired: "Nhập email của bạn.",
  emailInvalid: "Email không hợp lệ.",
  sentTitle: "Kiểm tra email của bạn",
  sentDescription: "Chúng tôi đã gửi link đặt lại mật khẩu tới {email}.",
  resend: "Gửi lại email",
};

export const socialLoginLabels = {
  divider: "hoặc",
  google: "Đăng nhập với Google",
  facebook: "Đăng nhập với Facebook",
  github: "Đăng nhập với GitHub",
};

export const socialRegisterLabels = {
  divider: "hoặc",
  google: "Đăng ký với Google",
  facebook: "Đăng ký với Facebook",
  github: "Đăng ký với GitHub",
};
