"use client";

import { useState, type ReactNode } from "react";
import { UserRound } from "lucide-react";
import {
  Button,
  LinkButton,
  PageContainer,
  Stack,
  Text,
} from "@/design-system";
import { useAuth } from "@/features/auth";
import { SETTINGS_TABS } from "../data";
import type { UserProfile } from "../profileApi";
import type { ProfileTabId } from "../types";
import { useProfile } from "../useProfile";
import { EditProfileTab } from "./EditProfileTab";
import { PreferencesTab } from "./PreferencesTab";
import { SecurityTab } from "./SecurityTab";
import { SectionsTab } from "./SectionsTab";
import { TabbedSections } from "./TabbedSections";

/** `/settings`: change the profile, security, preferences and the rest of the account. */
export function SettingsScreen() {
  const { user } = useAuth();
  const email = user?.email ?? "";
  const accountName = user?.name ?? email.split("@")[0] ?? "";
  const [activeTab, setActiveTab] = useState<ProfileTabId>("personal");
  const { profile, state, reload, save, changeAvatar, removeAvatar } =
    useProfile();

  /** Tabs that edit the profile need it loaded first. */
  function renderProfileTab(render: (loaded: UserProfile) => ReactNode) {
    if (profile) return render(profile);
    if (state === "error") {
      return (
        <Stack gap={3} align="start">
          <Text color="secondary">Không tải được hồ sơ của bạn.</Text>
          <Button variant="outline" onClick={reload}>
            Thử lại
          </Button>
        </Stack>
      );
    }
    return (
      <Text role="status" color="secondary">
        Đang tải hồ sơ...
      </Text>
    );
  }

  return (
    <PageContainer size="wide" spacing="compact">
      <div className="flex flex-col gap-4">
        <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <Text as="h1" size="heading-md" weight="semibold">
              Cài đặt tài khoản
            </Text>
            <Text size="body-sm" color="secondary">
              Quản lý thông tin, bảo mật và tuỳ chọn của bạn.
            </Text>
          </div>
          <LinkButton
            href="/profile"
            variant="outline"
            size="compact"
            leftIcon={UserRound}
          >
            Xem hồ sơ
          </LinkButton>
        </header>
        <TabbedSections
          label="Các mục cài đặt"
          tabs={SETTINGS_TABS}
          value={activeTab}
          onValueChange={setActiveTab}
          renderPanel={(tabId) => {
            if (tabId === "personal") {
              return renderProfileTab((loaded) => (
                <EditProfileTab
                  profile={loaded}
                  fallbackName={accountName}
                  onSave={save}
                  onUploadAvatar={changeAvatar}
                  onRemoveAvatar={removeAvatar}
                />
              ));
            }
            if (tabId === "security") return <SecurityTab />;
            if (tabId === "preferences") {
              return renderProfileTab((loaded) => (
                <PreferencesTab profile={loaded} onSave={save} />
              ));
            }
            return (
              <SectionsTab tabId={tabId as Exclude<ProfileTabId, "overview">} />
            );
          }}
        />
      </div>
    </PageContainer>
  );
}
