"use client";

import { useState, type FormEvent } from "react";
import {
  Button,
  FormField,
  Input,
  Stack,
  Text,
  Textarea,
} from "@/design-system";
import {
  ProfileApiError,
  type ProfilePatch,
  type UserProfile,
} from "../profileApi";
import { AvatarUpload } from "./AvatarUpload";
import { ChangePasswordForm } from "./ChangePasswordForm";
import { DeactivateOrDeleteSection } from "./DeactivateOrDeleteSection";
import { FormStatus, type FormStatusValue } from "./FormStatus";
import { ProfileCard } from "./ProfileCard";
import { SecurityAccordion } from "./SecurityAccordion";

const MAX_NAME = 100;
const MAX_BIO = 500;
// Same pattern as the backend's UpdateProfileDto.
const PHONE_PATTERN = /^\+?[\d\s-]{7,20}$/;

export interface EditProfileTabProps {
  profile: UserProfile;
  /** Name to show when the profile has no display name yet (the account name). */
  fallbackName: string;
  onSave: (patch: ProfilePatch) => Promise<void>;
  onUploadAvatar: (file: File) => Promise<void>;
  onRemoveAvatar: () => Promise<void>;
}

/** "Tài khoản": the profile picture and form, the password, and leaving the account. */
export function EditProfileTab({
  profile,
  fallbackName,
  onSave,
  onUploadAvatar,
  onRemoveAvatar,
}: EditProfileTabProps) {
  const [displayName, setDisplayName] = useState(profile.displayName ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [errors, setErrors] = useState<{
    displayName?: string;
    phone?: string;
  }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<FormStatusValue>();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: typeof errors = {};
    if (displayName.trim().length > MAX_NAME) {
      next.displayName = `Tên hiển thị tối đa ${MAX_NAME} ký tự.`;
    }
    if (phone.trim() && !PHONE_PATTERN.test(phone.trim())) {
      next.phone = "Số điện thoại không hợp lệ.";
    }
    setErrors(next);
    setStatus(undefined);
    if (Object.keys(next).length > 0) return;

    setIsSaving(true);
    try {
      // Empty fields are sent as null: the backend rejects "" for the phone.
      await onSave({
        displayName: displayName.trim() || null,
        bio: bio.trim() || null,
        phone: phone.trim() || null,
      });
      setStatus({ kind: "success", message: "Đã lưu thay đổi." });
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

  const initial =
    (profile.displayName ?? fallbackName).trim().charAt(0).toUpperCase() || "?";

  return (
    <Stack gap={4}>
      <Stack gap={1}>
        <Text as="h2" size="heading-md" weight="semibold">
          Tài khoản
        </Text>
        <Text size="body-md" color="secondary">
          Cập nhật hồ sơ, mật khẩu và quản lý tài khoản của bạn.
        </Text>
      </Stack>
      <div className="grid items-start gap-6 md:grid-cols-2">
        <ProfileCard title="Thông tin cá nhân">
          <AvatarUpload
            avatarUrl={profile.avatarUrl}
            initial={initial}
            onUpload={onUploadAvatar}
            onRemove={onRemoveAvatar}
          />
          <form
            onSubmit={handleSubmit}
            noValidate
            className="flex flex-col gap-4"
          >
            <FormField label="Email" description="Email không thể thay đổi.">
              <Input value={profile.email} readOnly disabled />
            </FormField>
            <FormField label="Tên hiển thị" error={errors.displayName}>
              <Input
                value={displayName}
                placeholder={fallbackName}
                autoComplete="nickname"
                onChange={(event) => setDisplayName(event.target.value)}
              />
            </FormField>
            <FormField
              label="Giới thiệu"
              description={`${bio.length}/${MAX_BIO} ký tự`}
            >
              <Textarea
                rows={4}
                maxLength={MAX_BIO}
                value={bio}
                onChange={(event) => setBio(event.target.value)}
              />
            </FormField>
            <FormField label="Số điện thoại" error={errors.phone}>
              <Input
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </FormField>
            <FormStatus status={status} />
            <div>
              <Button type="submit" variant="accent" isLoading={isSaving}>
                Lưu thay đổi
              </Button>
            </div>
          </form>
        </ProfileCard>
        <ProfileCard aria-label="Mật khẩu và quản lý tài khoản">
          <SecurityAccordion title="Đổi mật khẩu" isOpenByDefault>
            <ChangePasswordForm />
          </SecurityAccordion>
          <SecurityAccordion title="Hủy kích hoạt hoặc xóa tài khoản">
            <DeactivateOrDeleteSection />
          </SecurityAccordion>
        </ProfileCard>
      </div>
    </Stack>
  );
}
