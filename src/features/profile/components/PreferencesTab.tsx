"use client";

import { useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { Stack, Text, useTheme } from "@/design-system";
import {
  ProfileApiError,
  type LocaleChoice,
  type ProfilePatch,
  type ThemeChoice,
  type UserProfile,
} from "../profileApi";
import { ChoiceGroup, type Choice } from "./ChoiceGroup";
import { FormStatus, type FormStatusValue } from "./FormStatus";
import { ProfileCard } from "./ProfileCard";

const THEME_CHOICES: Choice<ThemeChoice>[] = [
  { value: "light", label: "Sáng", icon: Sun },
  { value: "dark", label: "Tối", icon: Moon },
  { value: "system", label: "Theo hệ thống", icon: Monitor },
];

const LOCALE_CHOICES: Choice<LocaleChoice>[] = [
  { value: "vi", label: "Tiếng Việt" },
  { value: "en", label: "English" },
];

export interface PreferencesTabProps {
  profile: UserProfile;
  onSave: (patch: ProfilePatch) => Promise<void>;
}

/** "Tuỳ chọn": the theme and the language, each saved to the account as soon as it is picked. */
export function PreferencesTab({ profile, onSave }: PreferencesTabProps) {
  const { preference, setPreference } = useTheme();
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<FormStatusValue>();

  async function save(patch: ProfilePatch, successMessage: string) {
    setIsSaving(true);
    setStatus(undefined);
    try {
      await onSave(patch);
      setStatus({ kind: "success", message: successMessage });
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

  function handleThemeChange(theme: ThemeChoice) {
    // Applied right away on this device; the account copy follows.
    setPreference(theme);
    void save({ theme }, "Đã lưu giao diện.");
  }

  return (
    <Stack gap={4}>
      <Stack gap={1}>
        <Text as="h2" size="heading-md" weight="semibold">
          Tuỳ chọn
        </Text>
        <Text size="body-md" color="secondary">
          Chọn giao diện và ngôn ngữ. Thay đổi được lưu ngay.
        </Text>
      </Stack>
      <div className="grid gap-6 md:grid-cols-2">
        <ProfileCard title="Giao diện">
          <ChoiceGroup
            label="Giao diện"
            choices={THEME_CHOICES}
            value={preference}
            disabled={isSaving}
            onChange={handleThemeChange}
          />
        </ProfileCard>
        <ProfileCard title="Ngôn ngữ">
          <ChoiceGroup
            label="Ngôn ngữ"
            choices={LOCALE_CHOICES}
            value={profile.locale}
            disabled={isSaving}
            onChange={(locale) => void save({ locale }, "Đã lưu ngôn ngữ.")}
          />
        </ProfileCard>
      </div>
      <FormStatus status={status} />
    </Stack>
  );
}
