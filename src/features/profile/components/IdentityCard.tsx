import {
  BadgeCheck,
  Camera,
  Check,
  ExternalLink,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Quote,
} from "lucide-react";
import { Badge, Button, Inline, Stack, Text } from "@/design-system";
import { PROFILE_OVERVIEW } from "../data";
import { ProfileCard } from "./ProfileCard";

export interface IdentityCardProps {
  name: string;
  email: string;
}

const IDENTITY_STATS = ["Dự án", "Nhật ký", "Bài viết", "Khóa học", "Điểm XP"];

export function IdentityCard({ name, email }: IdentityCardProps) {
  const profile = PROFILE_OVERVIEW;
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const stats = profile.stats.filter((stat) =>
    IDENTITY_STATS.includes(stat.label),
  );

  return (
    <ProfileCard aria-label="Hồ sơ">
      <div className="grid gap-6 md:grid-cols-[13fr_7fr]">
        <Stack gap={5}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative size-24 shrink-0">
              <div
                aria-hidden="true"
                className="flex size-full items-center justify-center rounded-pill border-2 border-border-strong bg-accent-pink font-display text-heading-xl text-ink"
              >
                {initial}
              </div>
              <Button
                variant="secondary"
                size="compact"
                aria-label="Tải ảnh đại diện lên"
                className="absolute -right-1 -bottom-1 size-9 rounded-pill px-0"
              >
                <Camera aria-hidden="true" size={16} />
              </Button>
            </div>
            <Stack gap={2} className="min-w-0">
              <Inline gap={1} align="center">
                <Text as="h2" size="heading-xl" weight="bold">
                  {name}
                </Text>
                <Button
                  variant="ghost"
                  size="compact"
                  aria-label="Sửa tên hiển thị"
                  className="px-2"
                >
                  <Pencil aria-hidden="true" size={16} />
                </Button>
              </Inline>
              <Badge variant="blue" icon={Check} className="w-fit">
                Thành viên từ {profile.memberSince}
              </Badge>
            </Stack>
            <Button
              variant="outline"
              size="compact"
              leftIcon={ExternalLink}
              className="shrink-0 sm:ml-auto"
            >
              Xem hồ sơ công khai
            </Button>
          </div>

          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            <li className="flex min-w-0 items-center gap-2">
              <Mail aria-hidden="true" size={16} className="shrink-0" />
              <Text size="body-md" className="min-w-0 break-all">
                {email}
              </Text>
              <Badge variant="success" size="sm" icon={BadgeCheck}>
                Đã xác minh
              </Badge>
            </li>
            <li className="flex items-center gap-2">
              <Phone aria-hidden="true" size={16} className="shrink-0" />
              <Text size="body-md">{profile.phone}</Text>
            </li>
            <li className="flex items-center gap-2">
              <MapPin aria-hidden="true" size={16} className="shrink-0" />
              <Text size="body-md">
                {profile.location} · {profile.timezone}
              </Text>
            </li>
          </ul>

          <Stack gap={2}>
            <Text size="body-md" weight="semibold">
              {profile.headline}
            </Text>
            <Text size="body-sm" color="secondary">
              {profile.bio}
            </Text>
            <ul aria-label="Chủ đề quan tâm" className="flex flex-wrap gap-2">
              {profile.interests.map((interest) => (
                <li key={interest}>
                  <Badge variant="blue" size="sm">
                    {interest}
                  </Badge>
                </li>
              ))}
            </ul>
          </Stack>

          <div className="flex flex-col gap-4 border-t border-border-subtle pt-4 sm:flex-row sm:items-center sm:justify-between">
            <dl className="flex flex-wrap divide-x divide-border-subtle">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-col px-4 first:pl-0 last:pr-0"
                >
                  <dd className="font-display text-heading-sm font-bold">
                    {stat.value}
                  </dd>
                  <dt className="text-caption text-text-muted">{stat.label}</dt>
                </div>
              ))}
            </dl>
            <Button variant="accent" leftIcon={Pencil} className="shrink-0">
              Chỉnh sửa hồ sơ
            </Button>
          </div>
        </Stack>
        <QuoteBox />
      </div>
    </ProfileCard>
  );
}

const QUOTE_LINE_COLORS = [
  "text-ink",
  "text-info-text",
  "text-danger-text",
] as const;

function QuoteBox() {
  const { lines } = PROFILE_OVERVIEW.quote;

  return (
    <figure className="relative flex min-h-48 flex-col justify-center overflow-hidden rounded-standard bg-accent-yellow/40 px-8 pt-10 pb-16">
      <Quote
        aria-hidden="true"
        size={32}
        className="absolute top-3 left-3 text-ink"
      />
      <blockquote className="text-center font-handwritten text-heading-md font-semibold">
        {lines.map((line, index) => (
          <p
            key={line}
            className={QUOTE_LINE_COLORS[index % QUOTE_LINE_COLORS.length]}
          >
            {line}
          </p>
        ))}
      </blockquote>
      <Quote
        aria-hidden="true"
        size={32}
        className="absolute right-3 bottom-3 rotate-180 text-ink"
      />
      <span
        aria-hidden="true"
        className="absolute right-6 -bottom-2 text-[4rem] leading-none"
      >
        🐼
      </span>
    </figure>
  );
}
