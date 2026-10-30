import { Badge, Stack, Text } from "@/design-system";

const OPTIONS = [
  {
    title: "Hủy kích hoạt tài khoản",
    description:
      "Không ai có thể nhìn thấy tài khoản của bạn, bao gồm cả nội dung lưu trữ trong đó. Bạn có thể kích hoạt lại tài khoản và khôi phục tất cả nội dung bất cứ lúc nào.",
  },
  {
    title: "Xóa tài khoản vĩnh viễn",
    description:
      "Tài khoản và nội dung của bạn sẽ bị xóa vĩnh viễn. Bạn có thể hủy yêu cầu xóa bằng cách kích hoạt lại tài khoản trong vòng 30 ngày.",
  },
];

/** The two ways to leave the account. Both are announced but not built yet. */
export function DeactivateOrDeleteSection() {
  return (
    <ul className="flex flex-col">
      {OPTIONS.map((option) => (
        <li
          key={option.title}
          className="border-b border-border-subtle py-3 first:pt-0 last:border-b-0 last:pb-0"
        >
          <Stack gap={1}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Text as="h4" size="body-md" weight="semibold">
                {option.title}
              </Text>
              <Badge size="sm" variant="yellow">
                Dự kiến ra mắt
              </Badge>
            </div>
            <Text size="body-sm" color="secondary">
              {option.description}
            </Text>
          </Stack>
        </li>
      ))}
    </ul>
  );
}
