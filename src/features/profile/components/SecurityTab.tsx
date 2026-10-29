import { Stack, Text } from "@/design-system";
import { ChangePasswordForm } from "./ChangePasswordForm";
import { DeleteAccountSection } from "./DeleteAccountSection";
import { ProfileCard } from "./ProfileCard";

/** "Bảo mật": change the password, or delete the account. */
export function SecurityTab() {
  return (
    <Stack gap={4}>
      <Stack gap={1}>
        <Text as="h2" size="heading-md" weight="semibold">
          Bảo mật
        </Text>
        <Text size="body-md" color="secondary">
          Giữ tài khoản của bạn an toàn.
        </Text>
      </Stack>
      <div className="grid gap-6 md:grid-cols-2">
        <ProfileCard title="Đổi mật khẩu">
          <ChangePasswordForm />
        </ProfileCard>
        <ProfileCard title="Xoá tài khoản">
          <DeleteAccountSection />
        </ProfileCard>
      </div>
    </Stack>
  );
}
