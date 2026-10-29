import {
  BadgeCheck,
  Check,
  ExternalLink,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Quote,
} from "lucide-react";
import { Badge, Button, LinkButton, Stack, Text } from "@/design-system";
import { PROFILE_OVERVIEW } from "../data";
import { ProfileCard } from "./ProfileCard";

export interface IdentityCardProps {
  name: string;
  email: string;
  /** Uploaded picture; the initial of `name` is shown without one. */
  avatarUrl?: string | null;
  /** Where the "Chỉnh sửa hồ sơ" link leads (the settings page). */
  editHref: string;
}

// Projects, learning logs, posts, courses and XP; the week's numbers live in the progress card.
const IDENTITY_STATS = ["Dự án", "Nhật ký", "Bài viết", "Khóa học", "Điểm XP"];

/**
 * The profile hero: who the member is (identity, contact, bio, topics, stats)
 * on the left 60%, a quiet quote panel on the right 40%. Stacks below 768px.
 */
export function IdentityCard({
  name,
  email,
  avatarUrl,
  editHref,
}: IdentityCardProps) {
  const profile = PROFILE_OVERVIEW;
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const stats = profile.stats.filter((stat) =>
    IDENTITY_STATS.includes(stat.label),
  );

  return (
    <ProfileCard aria-label="Hồ sơ" className="shadow-floating">
      <div className="grid gap-4 md:grid-cols-[3fr_2fr]">
        <Stack gap={4} className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <div
              aria-hidden="true"
              className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-pill border-2 border-border-strong bg-accent-pink font-display text-heading-md text-ink sm:size-20 sm:text-heading-lg"
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- external S3 URL
                <img
                  src={avatarUrl}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                initial
              )}
            </div>
            <Stack gap={2} className="min-w-0 flex-1">
              <Text
                as="h2"
                weight="bold"
                className="text-heading-md break-words md:text-heading-lg"
              >
                {name}
              </Text>
              <Badge variant="blue" icon={Check} className="w-fit">
                Thành viên từ {profile.memberSince}
              </Badge>
            </Stack>
            <Button
              variant="outline"
              size="compact"
              leftIcon={ExternalLink}
              className="shrink-0"
            >
              Xem hồ sơ công khai
            </Button>
          </div>

          <ul className="flex flex-wrap gap-x-5 gap-y-2">
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
            <Text size="body-lg" weight="semibold">
              {profile.headline}
            </Text>
            <Text size="body-md" color="secondary">
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
            <dl className="grid grid-cols-3 gap-x-4 gap-y-3 sm:flex sm:flex-wrap sm:gap-x-0 sm:divide-x sm:divide-border-subtle">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-col sm:px-4 sm:first:pl-0 sm:last:pr-0"
                >
                  <dd className="font-display text-heading-sm font-bold">
                    {stat.value}
                  </dd>
                  <dt className="text-caption text-text-muted">{stat.label}</dt>
                </div>
              ))}
            </dl>
            <LinkButton
              href={editHref}
              variant="accent"
              leftIcon={Pencil}
              className="shrink-0"
            >
              Chỉnh sửa hồ sơ
            </LinkButton>
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

/**
 * A pale panel, secondary to the identity beside it. The panda sits in a
 * reserved strip at the bottom, so it never overlaps the (at most 3) lines.
 */
function QuoteBox() {
  const { lines } = PROFILE_OVERVIEW.quote;

  return (
    <figure className="relative flex min-h-40 flex-col justify-center overflow-hidden rounded-standard border border-border-subtle bg-accent-yellow/40 px-6 pt-10 pb-20 md:min-h-full">
      <Quote
        aria-hidden="true"
        size={28}
        className="absolute top-3 left-3 text-ink"
      />
      <blockquote className="text-center font-handwritten text-heading-md font-semibold">
        {lines.slice(0, 3).map((line, index) => (
          <p
            key={line}
            className={QUOTE_LINE_COLORS[index % QUOTE_LINE_COLORS.length]}
          >
            {line}
          </p>
        ))}
      </blockquote>
      <span
        aria-hidden="true"
        className="absolute right-4 bottom-2 text-[3.5rem] leading-none"
      >
        🐼
      </span>
    </figure>
  );
}
