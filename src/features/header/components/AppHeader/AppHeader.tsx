"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { Bell, Check, ChevronDown, Moon, Sun, Zap } from "lucide-react";
import {
  Badge,
  Button,
  Container,
  DropdownMenu,
  IconButton,
  LinkButton,
  MenuContent,
  MenuItem,
  MenuTrigger,
  SearchInput,
  cn,
  focusRingClasses,
  mergeRefs,
  useTheme,
} from "@/design-system";
import {
  FacebookIcon,
  PandaIcon,
  UnitedKingdomFlagIcon,
  VietnamFlagIcon,
} from "../icons";

export interface HeaderLanguage {
  code: string;
  label: string;
  flag?: ReactNode;
}

export interface HeaderNavItem {
  label: string;
  href: string;
  /** Also current on deeper paths (`/goals` for `/goals/english`). */
  isSection?: boolean;
}

export const defaultHeaderNavItems: HeaderNavItem[] = [
  { label: "Học tập", href: "/learn" },
  { label: "Mục tiêu tiếng Anh", href: "/goals/english", isSection: true },
];

export interface AppHeaderLabels {
  brand: string;
  /** Accessible name of the page navigation. */
  navigation: string;
  dictionary: string;
  /** Visible text of the call to action. */
  start: string;
  /** Language of `start`, e.g. "zh-Hans". */
  startLang: string;
  /** Plain-language meaning of `start`, read out by screen readers. */
  startMeaning: string;
  facebook: string;
  opensInNewTab: string;
  darkMode: string;
  language: string;
  currentLanguage: string;
  notifications: string;
  notificationsUnread: string;
  /** `{count}` is replaced with the score. */
  score: string;
  profile: string;
  /** `{count}` is replaced with the profile badge number. */
  profileBadge: string;
}

export const defaultAppHeaderLabels: AppHeaderLabels = {
  brand: "Baolingo",
  navigation: "Điều hướng chính",
  dictionary: "Từ điển",
  start: "学习从这里开始~",
  startLang: "zh-Hans",
  startMeaning: "Bắt đầu học từ đây",
  facebook: "Facebook Community",
  opensInNewTab: "(mở trong tab mới)",
  darkMode: "Chế độ tối",
  language: "Ngôn ngữ",
  currentLanguage: "(đang chọn)",
  notifications: "Thông báo",
  notificationsUnread: "Thông báo, có tin chưa đọc",
  score: "{count} điểm",
  profile: "Hồ sơ",
  profileBadge: "{count} mục mới",
};

export const defaultHeaderLanguages: HeaderLanguage[] = [
  {
    code: "vi",
    label: "Tiếng Việt",
    flag: <VietnamFlagIcon className="h-4 w-6 shrink-0 rounded-sharp" />,
  },
  {
    code: "en",
    label: "English",
    flag: <UnitedKingdomFlagIcon className="h-4 w-6 shrink-0 rounded-sharp" />,
  },
];

export interface AppHeaderProps extends ComponentProps<"header"> {
  brandHref?: string;
  /** Where the dictionary search goes (a plain GET form, `?q=...`). */
  searchAction?: string;
  /** Where the call to action leads: the learning page. */
  learnHref?: string;
  /** Facebook community page; the link is left out when omitted. */
  facebookHref?: string;
  notificationsHref?: string;
  /** Shows a dot on the bell when above 0. */
  unreadNotifications?: number;
  /** The score / streak shown beside the lightning bolt. */
  score?: number;
  profileHref?: string;
  /** Small number on the avatar; hidden when 0 or omitted. */
  profileBadge?: number;
  /** Page links shown in a bar under the main row; none when empty. */
  navItems?: HeaderNavItem[];
  languages?: HeaderLanguage[];
  defaultLanguage?: string;
  onLanguageChange?: (code: string) => void;
  /** Keep the header at the top while scrolling. */
  isSticky?: boolean;
  /** Replace any of the texts (translations). */
  labels?: Partial<AppHeaderLabels>;
}

/**
 * CSS custom property holding the height of a sticky AppHeader, so other
 * sticky bars and scroll offsets can sit just beneath it:
 * `top-[var(--app-header-height,0px)]`. It is unset (read as 0) while the
 * header is not sticky.
 */
export const APP_HEADER_HEIGHT_VAR = "--app-header-height";

const fill = (template: string, count: number) =>
  template.replace("{count}", String(count));

/**
 * The top bar of the learning app.
 *
 * - Left: the panda logo and the name.
 * - Middle: the dictionary search and the "start learning" call to action.
 * - Right: Facebook community, dark mode, language, notifications, score and
 *   profile.
 *
 * Below `md` it wraps to two rows: the logo with the notification, score and
 * profile on the first, the search with the community, theme and language
 * controls on the second. The call to action appears from `lg`. It is a
 * client component, but every prop is plain data, so a Server Component
 * layout can render it.
 */
export function AppHeader({
  brandHref = "/",
  searchAction = "/dictionary",
  learnHref = "/learn",
  facebookHref,
  notificationsHref = "/notifications",
  unreadNotifications = 0,
  score,
  profileHref = "/profile",
  profileBadge,
  navItems = defaultHeaderNavItems,
  languages = defaultHeaderLanguages,
  defaultLanguage,
  onLanguageChange,
  isSticky = false,
  labels: labelOverrides,
  className,
  ref,
  ...props
}: AppHeaderProps) {
  const headerRef = useRef<HTMLElement>(null);
  const mergedRef = useMemo(() => mergeRefs(headerRef, ref), [ref]);
  const labels = { ...defaultAppHeaderLabels, ...labelOverrides };
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [languageCode, setLanguageCode] = useState(
    defaultLanguage ?? languages[0]?.code,
  );
  const language =
    languages.find((option) => option.code === languageCode) ?? languages[0];
  const hasUnread = unreadNotifications > 0;
  const hasBadge = profileBadge !== undefined && profileBadge > 0;

  // Publish the header's height (it changes when the layout wraps) while it
  // is sticky, so the bars beneath it know where to stick.
  useEffect(() => {
    const header = headerRef.current;
    if (!isSticky || !header) return;
    const root = document.documentElement;

    const publish = () =>
      root.style.setProperty(APP_HEADER_HEIGHT_VAR, `${header.offsetHeight}px`);
    publish();

    if (typeof ResizeObserver === "undefined") {
      return () => root.style.removeProperty(APP_HEADER_HEIGHT_VAR);
    }
    const observer = new ResizeObserver(publish);
    observer.observe(header);
    return () => {
      observer.disconnect();
      root.style.removeProperty(APP_HEADER_HEIGHT_VAR);
    };
  }, [isSticky]);

  function selectLanguage(code: string) {
    setLanguageCode(code);
    onLanguageChange?.(code);
  }

  return (
    <header
      ref={mergedRef}
      lang="vi"
      className={cn(
        "border-b border-border-default bg-surface-page",
        // A z-index makes the header its own stacking context (it is a flex
        // item of <body>), which would trap its menus beneath later sticky
        // bars. So only a sticky header gets one, high enough to stay above
        // sticky content below it.
        isSticky && "sticky top-0 z-[var(--z-dropdown)]",
        className,
      )}
      {...props}
    >
      <Container size="wide">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 py-2 md:h-16 md:flex-nowrap md:py-0">
          <a
            href={brandHref}
            className={cn(
              "order-1 inline-flex min-h-11 shrink-0 items-center gap-2 rounded-sharp",
              focusRingClasses,
            )}
          >
            <PandaIcon className="size-9" />
            <span className="font-display text-heading-sm font-bold text-text-primary">
              {labels.brand}
            </span>
          </a>

          {/* Below md this row is the second line; from md its children join the main row. */}
          <div className="order-3 flex w-full items-center gap-2 md:contents">
            <form
              role="search"
              action={searchAction}
              method="get"
              className="min-w-0 flex-1 md:order-2 md:max-w-sm"
            >
              <SearchInput
                name="q"
                aria-label={labels.dictionary}
                placeholder={labels.dictionary}
                autoComplete="off"
              />
            </form>

            <LinkButton
              href={learnHref}
              variant="accent"
              className="hidden md:order-3 lg:inline-flex"
            >
              <span aria-hidden="true">→</span>
              <span lang={labels.startLang}>{labels.start}</span>
              <span aria-hidden="true">♡</span>
              <span className="sr-only">{`(${labels.startMeaning})`}</span>
            </LinkButton>

            <div className="flex items-center gap-1 md:order-4 md:ml-auto">
              {facebookHref && (
                <LinkButton
                  href={facebookHref}
                  external
                  externalLabel={labels.opensInNewTab}
                  variant="ghost"
                  className="px-3 lg:px-4"
                >
                  <FacebookIcon className="size-5 shrink-0" />
                  <span className="sr-only lg:not-sr-only">
                    {labels.facebook}
                  </span>
                </LinkButton>
              )}

              <IconButton
                icon={theme === "dark" ? Sun : Moon}
                aria-label={labels.darkMode}
                aria-pressed={theme === "dark"}
                variant="ghost"
                onClick={toggleTheme}
              />

              {language && (
                <DropdownMenu>
                  <MenuTrigger>
                    <Button
                      variant="ghost"
                      aria-label={`${labels.language}: ${language.label}`}
                      rightIcon={ChevronDown}
                      className="px-3"
                    >
                      {language.flag}
                      <span className="sr-only lg:not-sr-only">
                        {language.label}
                      </span>
                    </Button>
                  </MenuTrigger>
                  <MenuContent align="end">
                    {languages.map((option) => (
                      <MenuItem
                        key={option.code}
                        onSelect={() => selectLanguage(option.code)}
                      >
                        <span className="flex items-center gap-3">
                          {option.flag}
                          {option.label}
                          {option.code === language.code && (
                            <>
                              <Check aria-hidden="true" size={16} />
                              <span className="sr-only">
                                {labels.currentLanguage}
                              </span>
                            </>
                          )}
                        </span>
                      </MenuItem>
                    ))}
                  </MenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          <div className="order-2 ml-auto flex items-center gap-1 md:order-5 md:ml-0">
            <span className="relative inline-flex">
              <LinkButton
                href={notificationsHref}
                variant="ghost"
                leftIcon={Bell}
                aria-label={
                  hasUnread ? labels.notificationsUnread : labels.notifications
                }
                className="aspect-square px-0"
              />
              {hasUnread && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute top-2 right-2 size-2.5 rounded-pill bg-danger-text ring-2 ring-surface-page"
                />
              )}
            </span>

            {score !== undefined && (
              <Badge variant="yellow" icon={Zap} className="font-semibold">
                <span aria-hidden="true">{score}</span>
                <span className="sr-only">{fill(labels.score, score)}</span>
              </Badge>
            )}

            <a
              href={profileHref}
              aria-label={
                hasBadge
                  ? `${labels.profile}, ${fill(labels.profileBadge, profileBadge)}`
                  : labels.profile
              }
              className={cn(
                "relative inline-flex size-11 items-center justify-center rounded-pill",
                focusRingClasses,
              )}
            >
              <PandaIcon className="size-9" />
              {hasBadge && (
                <Badge
                  variant="danger"
                  size="sm"
                  aria-hidden="true"
                  className="absolute top-0 right-0 min-w-5 justify-center px-1 ring-2 ring-surface-page"
                >
                  {profileBadge}
                </Badge>
              )}
            </a>
          </div>
        </div>
        {navItems.length > 0 && (
          <nav
            aria-label={labels.navigation}
            className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-2"
          >
            {navItems.map((item) => {
              const isCurrent =
                pathname === item.href ||
                (item.isSection && !!pathname?.startsWith(`${item.href}/`));
              return (
                <a
                  key={item.href}
                  href={item.href}
                  aria-current={isCurrent ? "page" : undefined}
                  className={cn(
                    "relative inline-flex min-h-11 shrink-0 items-center rounded-pill px-4 text-body-md font-medium text-text-secondary hover:bg-surface-sunken hover:text-text-primary",
                    "aria-[current=page]:bg-accent-lime aria-[current=page]:font-semibold aria-[current=page]:text-ink",
                    focusRingClasses,
                  )}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>
        )}
      </Container>
    </header>
  );
}
