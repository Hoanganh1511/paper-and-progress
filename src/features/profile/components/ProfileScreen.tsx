"use client";

import { useState } from "react";
import { PageContainer, Text } from "@/design-system";
import { useAuth } from "@/features/auth";
import { PROFILE_TABS, SETTINGS_HREF } from "../data";
import type { ProfileTabId } from "../types";
import { useProfile } from "../useProfile";
import { IdentityCard } from "./IdentityCard";
import { OverviewTab } from "./OverviewTab";
import { SectionsTab } from "./SectionsTab";
import { TabbedSections } from "./TabbedSections";

/** `/profile`: who the member is. Changing anything happens on `/settings`. */
export function ProfileScreen() {
  const { user } = useAuth();
  const email = user?.email ?? "";
  const accountName = user?.name ?? email.split("@")[0] ?? "";
  const [activeTab, setActiveTab] = useState<ProfileTabId>("overview");
  const { profile } = useProfile();
  const name = profile?.displayName || accountName;

  return (
    <PageContainer size="wide" spacing="compact">
      <div className="flex flex-col gap-4">
        <header className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <Text as="h1" size="heading-lg" weight="bold">
            Hồ sơ cá nhân
          </Text>
          <Text size="body-md" color="secondary">
            Thông tin, thành tích và tiến độ học của bạn.
          </Text>
        </header>
        <IdentityCard
          name={name}
          email={email}
          avatarUrl={profile?.avatarUrl}
          editHref={SETTINGS_HREF}
        />
        <TabbedSections
          variant="pill"
          label="Các mục hồ sơ"
          tabs={PROFILE_TABS}
          value={activeTab}
          onValueChange={setActiveTab}
          renderPanel={(tabId) =>
            tabId === "overview" ? (
              <OverviewTab />
            ) : (
              <SectionsTab tabId={tabId} />
            )
          }
        />
      </div>
    </PageContainer>
  );
}
