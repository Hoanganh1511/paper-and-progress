"use client";

import { useState, type FormEvent } from "react";
import { Button, FormField, PasswordInput } from "@/design-system";
import { ProfileApiError, changePassword } from "../profileApi";
import { FormStatus, type FormStatusValue } from "./FormStatus";

const MIN_LENGTH = 8;
// Same rule as the backend's ChangePasswordDto.
const STRENGTH_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

type Field = "currentPassword" | "newPassword" | "confirmPassword";

/** Current password + new password + confirmation, each with a show/hide toggle. */
export function ChangePasswordForm() {
  const [values, setValues] = useState<Record<Field, string>>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<FormStatusValue>();

  function bind(field: Field) {
    return {
      value: values[field],
      onChange: (event: { target: { value: string } }) =>
        setValues((prev) => ({ ...prev, [field]: event.target.value })),
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: typeof errors = {};
    if (!values.currentPassword) {
      next.currentPassword = "Nhập mật khẩu hiện tại.";
    }
    if (!values.newPassword) {
      next.newPassword = "Nhập mật khẩu mới.";
    } else if (values.newPassword.length < MIN_LENGTH) {
      next.newPassword = `Dùng ít nhất ${MIN_LENGTH} ký tự.`;
    } else if (!STRENGTH_PATTERN.test(values.newPassword)) {
      next.newPassword = "Mật khẩu phải có chữ hoa, chữ thường và số.";
    }
    if (!values.confirmPassword) {
      next.confirmPassword = "Nhập lại mật khẩu mới.";
    } else if (values.confirmPassword !== values.newPassword) {
      next.confirmPassword = "Hai mật khẩu không khớp.";
    }
    setErrors(next);
    setStatus(undefined);
    if (Object.keys(next).length > 0) return;

    setIsSaving(true);
    try {
      await changePassword(values);
      setValues({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setStatus({ kind: "success", message: "Đã đổi mật khẩu." });
    } catch (error) {
      setStatus({
        kind: "error",
        message:
          error instanceof ProfileApiError
            ? error.message
            : "Có lỗi xảy ra. Thử lại sau.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <FormField
        label="Mật khẩu hiện tại"
        required
        error={errors.currentPassword}
      >
        <PasswordInput
          autoComplete="current-password"
          toggleLabel="Hiện mật khẩu hiện tại"
          {...bind("currentPassword")}
        />
      </FormField>
      <FormField
        label="Mật khẩu mới"
        required
        description={`Ít nhất ${MIN_LENGTH} ký tự, gồm chữ hoa, chữ thường và số.`}
        error={errors.newPassword}
      >
        <PasswordInput
          autoComplete="new-password"
          toggleLabel="Hiện mật khẩu mới"
          {...bind("newPassword")}
        />
      </FormField>
      <FormField
        label="Xác nhận mật khẩu mới"
        required
        error={errors.confirmPassword}
      >
        <PasswordInput
          autoComplete="new-password"
          toggleLabel="Hiện mật khẩu xác nhận"
          {...bind("confirmPassword")}
        />
      </FormField>
      <FormStatus status={status} />
      <div>
        <Button type="submit" variant="accent" isLoading={isSaving}>
          Đổi mật khẩu
        </Button>
      </div>
    </form>
  );
}
