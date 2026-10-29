import {
  Bookmark,
  ChevronRight,
  Flame,
  GraduationCap,
  Info,
  NotebookPen,
  PenLine,
  Plus,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import {
  Badge,
  LinkButton,
  ProgressBar,
  Stack,
  Text,
  cn,
} from "@/design-system";
import { PROFILE_OVERVIEW, SETTINGS_HREF } from "../data";
import type { ActivityKind, StreakDayStatus } from "../types";
import { ProfileCard } from "./ProfileCard";

// Fill colours follow the spec; the emoji and the hidden text say the same thing
// without colour. No per-cell outline: these are not controls.
const STREAK_DAY: Record<
  StreakDayStatus,
  { emoji: string; text: string; className: string }
> = {
  done: { emoji: "🔥", text: "đã học", className: "bg-accent-lime" },
  missed: { emoji: "💤", text: "nghỉ", className: "bg-accent-blue/25" },
  today: { emoji: "✏️", text: "hôm nay", className: "bg-accent-yellow" },
  upcoming: {
    emoji: "·",
    text: "sắp tới",
    className: "border border-border-default bg-surface-card",
  },
};

const ACTIVITY_ICON: Record<ActivityKind, LucideIcon> = {
  lesson: GraduationCap,
  diary: PenLine,
  bookmark: Bookmark,
  devlog: NotebookPen,
};

const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-border-focus";

/**
 * The profile's summary on a 12-column grid. Row one is quick info / skills /
 * streak (3 / 4 / 5 columns from 1200px, two columns with the streak across
 * the bottom from 768px, one column below). Row two is progress and activity.
 */
export function OverviewTab() {
  return (
    <div className="flex flex-col gap-3 md:gap-4">
      <div className="grid items-start gap-3 md:grid-cols-2 md:gap-4 min-[1200px]:grid-cols-12">
        <div className="min-[1200px]:col-span-3">
          <QuickInfoCard />
        </div>
        <div className="min-[1200px]:col-span-4">
          <SkillsCard />
        </div>
        <div className="md:col-span-2 min-[1200px]:col-span-5">
          <StreakCard />
        </div>
      </div>
      <div className="grid items-start gap-3 md:gap-4 min-[1200px]:grid-cols-[5.5fr_6.5fr]">
        <ProgressCard />
        <ActivityCard />
      </div>
    </div>
  );
}

/** The card title with a small icon in front of it. */
function CardTitle({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: string;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <Icon aria-hidden="true" size={18} className="shrink-0" />
      {children}
    </span>
  );
}

function EditLink({ label }: { label: string }) {
  return (
    <LinkButton
      href={SETTINGS_HREF}
      variant="outline"
      size="compact"
      aria-label={label}
    >
      Chỉnh sửa
    </LinkButton>
  );
}

function QuickInfoCard() {
  const { quickInfo } = PROFILE_OVERVIEW;

  return (
    <ProfileCard
      title={<CardTitle icon={Info}>Thông tin nhanh</CardTitle>}
      action={<EditLink label="Chỉnh sửa thông tin nhanh" />}
    >
      {/* Soft dividers: the card's own border is the only heavy line. */}
      <dl className="flex flex-col divide-y divide-border-subtle">
        {quickInfo.map((item) => (
          <div
            key={item.label}
            className="flex min-h-10 items-center justify-between gap-4 py-2"
          >
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

function SkillsCard() {
  const { skills, certificates } = PROFILE_OVERVIEW;

  return (
    <ProfileCard
      title="Kỹ năng & Chuyên môn"
      action={<EditLink label="Chỉnh sửa kỹ năng" />}
    >
      <ul className="flex flex-wrap items-center gap-2">
        {skills.map((skill) => (
          <li key={skill}>
            <Badge variant="lime">{skill}</Badge>
          </li>
        ))}
        <li>
          <LinkButton
            href={SETTINGS_HREF}
            variant="ghost"
            size="compact"
            leftIcon={Plus}
            aria-label="Thêm kỹ năng"
          >
            Thêm
          </LinkButton>
        </li>
      </ul>
      <Text as="h3" size="body-sm" weight="semibold" color="muted">
        Chứng chỉ
      </Text>
      <ul className="flex flex-col gap-2">
        {certificates.map((certificate) => (
          <li
            key={certificate.name}
            className="flex items-center gap-3 rounded-standard bg-surface-muted p-2"
          >
            <span
              aria-hidden="true"
              className="flex size-10 shrink-0 items-center justify-center rounded-standard border border-border-default bg-surface-card font-display"
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

function StreakCard() {
  const { streak } = PROFILE_OVERVIEW;

  return (
    <ProfileCard
      title="Chuỗi ngày học"
      action={
        <LinkButton
          href="/goals/english/diary"
          variant="ghost"
          size="compact"
          rightIcon={ChevronRight}
        >
          Xem chi tiết
        </LinkButton>
      }
    >
      <div className="flex items-center gap-3">
        <Flame
          aria-hidden="true"
          size={44}
          className="shrink-0 text-ink"
          fill="var(--color-accent-yellow)"
        />
        <Text
          font="display"
          weight="bold"
          className="text-[2.75rem] leading-none"
        >
          {streak.days}
          <span className="sr-only"> ngày liên tiếp</span>
        </Text>
        <Text aria-hidden="true" size="body-md" color="muted">
          ngày liên tiếp
        </Text>
      </div>
      <ul className="grid grid-cols-7 gap-2 md:gap-2.5">
        {streak.week.map((day) => {
          const status = STREAK_DAY[day.status];
          return (
            <li key={day.label} className="flex flex-col items-center gap-1">
              <span
                className={cn(
                  "flex h-11 w-full items-center justify-center rounded-standard",
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
      <div className="flex items-center gap-3 rounded-standard bg-surface-muted p-3">
        <span aria-hidden="true" className="text-heading-lg leading-none">
          🦉
        </span>
        <Text size="body-sm" color="secondary">
          {streak.message}
        </Text>
      </div>
    </ProfileCard>
  );
}

function ProgressCard() {
  const { weekMetrics, weeklyGoal } = PROFILE_OVERVIEW;

  return (
    <ProfileCard
      title={<CardTitle icon={Sparkles}>Tiến độ tuần này</CardTitle>}
    >
      <dl className="grid grid-cols-2 gap-2 min-[1200px]:grid-cols-4">
        {weekMetrics.map((metric) => (
          <div
            key={metric.label}
            className="flex flex-col gap-1 rounded-standard bg-surface-muted p-3"
          >
            <dd className="font-display text-heading-lg leading-none font-bold">
              {metric.value}
            </dd>
            <dt className="text-caption text-text-muted">{metric.label}</dt>
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
    </ProfileCard>
  );
}

function ActivityCard() {
  const { recentActivity } = PROFILE_OVERVIEW;

  return (
    <ProfileCard title="Hoạt động gần đây">
      <ol className="flex flex-col">
        {recentActivity.map((item) => {
          const Icon = ACTIVITY_ICON[item.kind];
          const content = (
            <>
              <span
                aria-hidden="true"
                className="relative z-10 flex size-9 shrink-0 items-center justify-center rounded-standard bg-accent-blue/25"
              >
                <Icon size={18} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-body-md font-medium">
                  {item.action}
                  <span className="text-text-muted"> · </span>
                  <span className="font-normal">{item.title}</span>
                </span>
                <span className="text-caption text-text-muted">
                  {item.time}
                </span>
              </span>
              {item.href && (
                <ChevronRight
                  aria-hidden="true"
                  size={16}
                  className="shrink-0 text-text-muted"
                />
              )}
            </>
          );

          return (
            <li key={item.id} className="group relative">
              {/* The timeline rail joins each icon to the next. */}
              <span
                aria-hidden="true"
                className="absolute top-9 bottom-0 left-[1.0625rem] w-px bg-border-subtle group-last:hidden"
              />
              {item.href ? (
                <a
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-standard py-2 hover:bg-surface-muted",
                    FOCUS_RING,
                  )}
                >
                  {content}
                </a>
              ) : (
                <div className="flex items-center gap-3 py-2">{content}</div>
              )}
            </li>
          );
        })}
      </ol>
    </ProfileCard>
  );
}
