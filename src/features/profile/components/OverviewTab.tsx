import { Check, Flame, Link2, Plus, X } from "lucide-react";
import {
  Badge,
  Button,
  Inline,
  ProgressBar,
  Stack,
  Text,
  cn,
} from "@/design-system";
import { PROFILE_OVERVIEW } from "../data";
import type { StreakDayStatus } from "../types";
import { BrandIcon } from "./BrandIcon";
import { ProfileCard } from "./ProfileCard";

const STREAK_DAY: Record<
  StreakDayStatus,
  { emoji: string; text: string; className: string }
> = {
  done: { emoji: "🔥", text: "đã học", className: "bg-accent-lime" },
  missed: { emoji: "💤", text: "bỏ lỡ", className: "bg-surface-sunken" },
  today: { emoji: "✏️", text: "hôm nay", className: "bg-accent-yellow" },
  upcoming: { emoji: "·", text: "sắp tới", className: "bg-surface-card" },
};

/** The profile's summary: three columns on desktop, one stacked column on mobile. */
export function OverviewTab() {
  return (
    <Stack gap={6}>
      <div className="grid items-start gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <Stack gap={6}>
          <QuickInfoCard />
          <LinkedAccountsCard />
        </Stack>
        <Stack gap={6}>
          <SkillsCard />
          <PlanCard />
        </Stack>
        <Stack gap={6} className="lg:col-span-2 xl:col-span-1">
          <StreakCard />
          <ProgressCard />
          <BadgesCard />
        </Stack>
      </div>
    </Stack>
  );
}

function QuickInfoCard() {
  const { quickInfo } = PROFILE_OVERVIEW;

  return (
    <ProfileCard
      title="Thông tin nhanh"
      action={
        <Button variant="outline" size="compact">
          Chỉnh sửa
        </Button>
      }
    >
      <dl className="flex flex-col gap-2">
        {quickInfo.map((item) => (
          <div key={item.label} className="flex justify-between gap-4">
            <dt className="text-body-sm text-text-muted">{item.label}</dt>
            <dd className="text-right text-body-sm font-medium">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </ProfileCard>
  );
}

function LinkedAccountsCard() {
  return (
    <ProfileCard title="Tài khoản liên kết">
      <ul className="flex flex-col divide-y divide-border-subtle">
        {PROFILE_OVERVIEW.linkedAccounts.map((account) => (
          <li
            key={account.provider}
            className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
          >
            <div className="flex min-w-0 items-center gap-3">
              <BrandIcon
                provider={account.provider}
                size={24}
                className="shrink-0"
              />
              <Stack gap={1} className="min-w-0">
                <Text size="body-md" weight="medium">
                  {account.provider}
                </Text>
                <Text size="caption" color="muted" truncate>
                  {account.isLinked ? `✓ ${account.handle}` : "Chưa liên kết"}
                </Text>
              </Stack>
            </div>
            {account.isLinked ? (
              <Button
                variant="outline"
                size="compact"
                aria-label={`Ngắt kết nối ${account.provider}`}
                className="shrink-0"
              >
                Ngắt kết nối
              </Button>
            ) : (
              <Button
                variant="accent"
                size="compact"
                leftIcon={Link2}
                aria-label={`Liên kết ${account.provider}`}
                className="shrink-0"
              >
                Liên kết
              </Button>
            )}
          </li>
        ))}
      </ul>
    </ProfileCard>
  );
}

function SkillsCard() {
  const { skills, certificates } = PROFILE_OVERVIEW;

  return (
    <ProfileCard
      title="Kỹ năng & Chuyên môn"
      action={
        <Button variant="outline" size="compact">
          Chỉnh sửa
        </Button>
      }
    >
      <ul className="flex flex-wrap items-center gap-2">
        {skills.map((skill) => (
          <li key={skill}>
            <Badge variant="lime">{skill}</Badge>
          </li>
        ))}
        <li>
          <Button variant="outline" size="compact" leftIcon={Plus}>
            Thêm
          </Button>
        </li>
      </ul>
      <Text as="h3" size="body-sm" weight="semibold" color="muted">
        Chứng chỉ
      </Text>
      <ul className="flex flex-col gap-3">
        {certificates.map((certificate) => (
          <li key={certificate.name} className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="flex size-10 shrink-0 items-center justify-center rounded-standard border-2 border-border-strong bg-surface-sunken font-display"
            >
              {certificate.issuer.charAt(0)}
            </span>
            <Stack gap={1} className="min-w-0">
              <Text size="body-md" weight="medium">
                {certificate.name}
              </Text>
              <Text size="caption" color="muted">
                {certificate.issuer} · {certificate.year}
              </Text>
            </Stack>
          </li>
        ))}
      </ul>
    </ProfileCard>
  );
}

function PlanCard() {
  const { plan } = PROFILE_OVERVIEW;

  return (
    <ProfileCard
      title="Gói hiện tại"
      action={
        <Button variant="accent" size="compact">
          Nâng cấp
        </Button>
      }
    >
      <Stack gap={1}>
        <Text size="heading-md" weight="semibold" font="display">
          {plan.name}
        </Text>
        <Text size="body-sm" color="secondary">
          {plan.description}
        </Text>
      </Stack>
      <ul className="flex flex-col gap-2">
        {plan.features.map((feature) => (
          <li key={feature.label} className="flex items-center gap-2">
            {feature.isIncluded ? (
              <Check
                aria-hidden="true"
                size={16}
                className="shrink-0 text-success-text"
              />
            ) : (
              <X
                aria-hidden="true"
                size={16}
                className="shrink-0 text-text-muted"
              />
            )}
            <Text
              size="body-sm"
              color={feature.isIncluded ? "primary" : "muted"}
            >
              {feature.label}
              <span className="sr-only">
                {feature.isIncluded ? " (có)" : " (không có)"}
              </span>
            </Text>
          </li>
        ))}
      </ul>
    </ProfileCard>
  );
}

function StreakCard() {
  const { streak } = PROFILE_OVERVIEW;

  return (
    <ProfileCard title="Chuỗi ngày học">
      <Inline gap={3} align="center">
        <Flame
          aria-hidden="true"
          size={48}
          className="shrink-0 text-ink"
          fill="var(--color-accent-yellow)"
        />
        <Text size="display-lg" weight="bold" font="display">
          {streak.days}
          <span className="sr-only"> ngày liên tiếp</span>
        </Text>
        <Text aria-hidden="true" size="body-md" color="muted">
          ngày liên tiếp
        </Text>
      </Inline>
      <ul className="grid grid-cols-7 gap-2">
        {streak.week.map((day) => {
          const status = STREAK_DAY[day.status];
          return (
            <li key={day.label} className="flex flex-col items-center gap-1">
              <span
                className={cn(
                  "flex size-10 items-center justify-center rounded-standard border-2 border-border-strong",
                  status.className,
                )}
              >
                <span aria-hidden="true">{status.emoji}</span>
                <span className="sr-only">{status.text}</span>
              </span>
              <Text size="caption" color="muted">
                {day.label}
              </Text>
            </li>
          );
        })}
      </ul>
      <Inline gap={2} align="center">
        <span aria-hidden="true" className="text-heading-lg">
          🦉
        </span>
        <Text size="body-sm" color="secondary">
          {streak.message}
        </Text>
      </Inline>
    </ProfileCard>
  );
}

function ProgressCard() {
  const { stats, weeklyGoal, goals } = PROFILE_OVERVIEW;

  return (
    <ProfileCard title="Tổng quan tiến độ">
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col gap-1 rounded-standard border-2 border-border-strong bg-surface-sunken p-3"
          >
            <dd className="font-display text-heading-md font-bold">
              {stat.value}
            </dd>
            <dt className="text-caption text-text-muted">{stat.label}</dt>
          </div>
        ))}
      </dl>
      <Stack gap={1}>
        <Text size="body-sm" weight="medium">
          Mục tiêu tuần
        </Text>
        <ProgressBar
          value={weeklyGoal.percent}
          label="Mục tiêu tuần"
          showValue
        />
        <Text size="caption" color="muted">
          {weeklyGoal.label}
        </Text>
      </Stack>
      <ul className="flex flex-col gap-2">
        {goals.map((goal) => (
          <li key={goal.id} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-standard border-2 border-border-strong",
                goal.isDone && "bg-accent-lime",
              )}
            >
              {goal.isDone && <Check size={14} />}
            </span>
            <Text
              size="body-sm"
              className={cn(goal.isDone && "line-through")}
              color={goal.isDone ? "muted" : "primary"}
            >
              {goal.label}
              <span className="sr-only">
                {goal.isDone ? " (đã xong)" : " (chưa xong)"}
              </span>
            </Text>
          </li>
        ))}
      </ul>
    </ProfileCard>
  );
}

function BadgesCard() {
  return (
    <ProfileCard
      title="Huy hiệu đạt được"
      action={
        <Button variant="ghost" size="compact">
          Xem tất cả
        </Button>
      }
    >
      <ul className="grid grid-cols-3 gap-3">
        {PROFILE_OVERVIEW.badges.map((badge) => (
          <li key={badge.id} className="flex flex-col items-center gap-1">
            <span
              aria-hidden="true"
              className="flex size-14 items-center justify-center rounded-pill border-2 border-border-strong bg-accent-lime text-heading-lg"
            >
              {badge.emoji}
            </span>
            <Text size="caption" align="center">
              {badge.name}
            </Text>
          </li>
        ))}
      </ul>
    </ProfileCard>
  );
}
