import { Stack, Text } from "@/design-system";
import { ProfileCard } from "./ProfileCard";
import { SecurityAccordion } from "./SecurityAccordion";
import { SecurityLinkList } from "./SecurityLinkList";
import { TwoFactorSection } from "./TwoFactorSection";

const SOON = "Dự kiến ra mắt";

/** "Bảo mật & Quyền": two-step verification, security alerts and the security checkup. */
export function SecurityTab() {
  return (
    <Stack gap={4}>
      <Stack gap={1}>
        <Text as="h2" size="heading-md" weight="semibold">
          Bảo mật & Quyền
        </Text>
        <Text size="body-md" color="secondary">
          Giữ tài khoản của bạn an toàn.
        </Text>
      </Stack>
      <div className="grid items-start gap-6 md:grid-cols-2">
        <ProfileCard
          id="two-factor"
          title="Xác thực hai bước"
          className="scroll-mt-4"
        >
          <TwoFactorSection />
        </ProfileCard>
        <ProfileCard aria-label="Cảnh báo và kiểm tra bảo mật">
          <SecurityAccordion title="Cảnh báo bảo mật" isOpenByDefault>
            <SecurityLinkList
              label="Cảnh báo bảo mật"
              items={[
                { label: "Cảnh báo bảo mật", badge: SOON },
                { label: "Thiết bị của bạn", badge: SOON },
              ]}
            />
          </SecurityAccordion>
          <SecurityAccordion title="Kiểm tra bảo mật" isOpenByDefault>
            <Stack gap={4}>
              <SecurityLinkList
                label="Kiểm tra bảo mật"
                items={[
                  { label: "Điện thoại", badge: SOON },
                  { label: "Xác minh 2 bước", href: "#two-factor" },
                  { label: "Email", badge: SOON },
                  { label: "Thiết bị của bạn", badge: SOON },
                  { label: "Hoạt động bảo mật", badge: SOON },
                ]}
              />
              <Stack gap={1}>
                <Text as="h4" size="body-md" weight="semibold">
                  Thông tin thanh toán
                </Text>
                <SecurityLinkList
                  label="Thông tin thanh toán"
                  items={[
                    {
                      label: "Tự động điền thông tin thanh toán",
                      badge: SOON,
                    },
                    {
                      label: "Tự động điền thông tin liên hệ",
                      badge: SOON,
                    },
                  ]}
                />
              </Stack>
            </Stack>
          </SecurityAccordion>
        </ProfileCard>
      </div>
    </Stack>
  );
}
