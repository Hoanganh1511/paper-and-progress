"use client";

import {
  PageContainer,
  TabList,
  TabPanel,
  TabTrigger,
  Text,
  Tabs,
} from "@/design-system";
import { useAuth } from "@/features/auth";
import { PROFILE_TABS } from "../data";
import { IdentityCard } from "./IdentityCard";
import { OverviewTab } from "./OverviewTab";
import { SectionsTab } from "./SectionsTab";

/** `/profile`: header, a tab bar for each area of the account, and the active tab's body. */
export function ProfileScreen() {
  const { user } = useAuth();
  const email = user?.email ?? "";
  const name = user?.name ?? email.split("@")[0] ?? "";

  return (
    <PageContainer size="wide" spacing="compact">
      <div className="flex flex-col gap-4">
        <header className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <Text as="h1" size="heading-md" weight="semibold">
            Hồ sơ cá nhân
          </Text>
          <Text size="body-sm" color="secondary">
            Quản lý thông tin, bảo mật và tiến độ học của bạn.
          </Text>
        </header>
        <IdentityCard name={name} email={email} />
        <Tabs defaultValue="overview">
          <TabList aria-label="Các mục hồ sơ" className="overflow-x-auto">
            {PROFILE_TABS.map((tab) => (
              <TabTrigger key={tab.id} value={tab.id}>
                <tab.icon aria-hidden="true" size={16} className="shrink-0" />
                {tab.label}
              </TabTrigger>
            ))}
          </TabList>
          {PROFILE_TABS.map((tab) => (
            <TabPanel key={tab.id} value={tab.id}>
              {tab.id === "overview" ? (
                <OverviewTab />
              ) : (
                <SectionsTab tabId={tab.id} />
              )}
            </TabPanel>
          ))}
        </Tabs>
      </div>
    </PageContainer>
  );
}
