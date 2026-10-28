"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Bookmark,
  ChevronRight,
  GraduationCap,
  Laptop,
  LogIn,
  LogOut,
  type LucideIcon,
  Moon,
  Settings,
  Sparkles,
  Sun,
  User,
  Zap,
} from "lucide-react";
import {
  AlertDialog,
  Badge,
  Button,
  Container,
  DropdownMenu,
  LinkButton,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  MenuTrigger,
  SearchInput,
  cn,
  focusRingClasses,
  mergeRefs,
  useTheme,
} from "@/design-system";
import { FacebookIcon, PandaIcon } from "../icons";

export interface HeaderUser {
  name: string;
  email: string;
}

export interface HeaderNavItem {
  label: string;
  href: string;
  /** Also current on deeper paths (`/goals` for `/goals/english`). */
  isSection?: boolean;
  /** Decorative icon shown before the label; hidden from screen readers. */
  icon?: LucideIcon;
  /** The link's own button style, e.g. a background colour. */
  className?: string;
}

export const defaultHeaderNavItems: HeaderNavItem[] = [
  {
    label: "Công nghệ thông tin",
    href: "/goals/tech",
    isSection: true,
    icon: Laptop,
    className: "bg-accent-yellow",
  },
];

export interface AppHeaderLabels {
  brand: string;
  /** Accessible name of the page navigation. */
  navigation: string;
  /** Visible text of the button that reveals the page links. */
  explore: string;
  dictionary: string;
  /** Visible text of the highlighted link to the English goals page. */
  goals: string;
  /** Visible text of the call to action. */
  start: string;
  /** Language of `start`, e.g. "vi". */
  startLang: string;
  /** Plain-language meaning of `start`, read out by screen readers. */
  startMeaning: string;
  facebook: string;
  opensInNewTab: string;
  darkMode: string;
  /** State words beside the dark mode switch in the account menu. */
  themeOn: string;
  themeOff: string;
  /** Heading of the account menu's page links and of its settings. */
  accountPages: string;
  accountPreferences: string;
  notifications: string;
  notificationsUnread: string;
  /** `{count}` is replaced with the score. */
  score: string;
  profile: string;
  /** Menu entries of the account menu. */
  profileInfo: string;
  bookmarks: string;
  settings: string;
  /** Visible text of the sign-in button shown while signed out. */
  signIn: string;
  logout: string;
  logoutTitle: string;
  logoutDescription: string;
  logoutConfirm: string;
  logoutCancel: string;
  /** `{count}` is replaced with the profile badge number. */
  profileBadge: string;
}

export const defaultAppHeaderLabels: AppHeaderLabels = {
  brand: "Baolingo",
  navigation: "Điều hướng chính",
  explore: "Khám phá",
  dictionary: "Từ điển",
  goals: "Mục tiêu tiếng Anh",
  start: "Học tập",
  startLang: "vi",
  startMeaning: "Bắt đầu học từ đây",
  facebook: "Facebook Community",
  opensInNewTab: "(mở trong tab mới)",
  darkMode: "Chế độ tối",
  themeOn: "Bật",
  themeOff: "Tắt",
  accountPages: "Trang của bạn",
  accountPreferences: "Tuỳ chọn",
  notifications: "Thông báo",
  notificationsUnread: "Thông báo, có tin chưa đọc",
  score: "{count} điểm",
  profile: "Hồ sơ",
  profileInfo: "Thông tin cá nhân",
  bookmarks: "Bookmarks",
  settings: "Cài đặt",
  signIn: "Đăng nhập",
  logout: "Đăng xuất",
  logoutTitle: "Đăng xuất khỏi tài khoản?",
  logoutDescription: "Bạn sẽ cần đăng nhập lại để tiếp tục học.",
  logoutConfirm: "Đăng xuất",
  logoutCancel: "Huỷ",
  profileBadge: "{count} mục mới",
};

export interface AppHeaderProps extends ComponentProps<"header"> {
  brandHref?: string;
  /** Where the dictionary search goes (a plain GET form, `?q=...`). */
  searchAction?: string;
  /** Where the highlighted goals button leads: the English goals page. */
  goalsHref?: string;
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
  bookmarksHref?: string;
  settingsHref?: string;
  /** Shown at the top of the account menu; the section is left out when omitted. */
  user?: HeaderUser;
  /** Replaces the avatar menu with a sign-in button. */
  isSignedOut?: boolean;
  signInHref?: string;
  /** Called after the user confirms logging out. */
  onLogout?: () => void;
  /** Small number on the avatar; hidden when 0 or omitted. */
  profileBadge?: number;
  /** Page links shown in a bar under the main row; none when empty. */
  navItems?: HeaderNavItem[];
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

/** Length of the Button press animation (`duration-150` in buttonVariants). */
const PRESS_DURATION_MS = 150;

/**
 * The "Explore" button with the page links it reveals. The links open while
 * a mouse hovers the button or its panel, and for everyone else on click /
 * Enter / Space. Escape or moving focus away closes them. The links stay in
 * the DOM, hidden, so the nav is rendered on the server.
 */
function ExploreMenu({
  label,
  navLabel,
  children,
}: {
  label: string;
  navLabel: string;
  children: ReactNode;
}) {
  // `isOpen` presses the button at once; `isShown` reveals the panel only
  // after that press animation has finished (see PRESS_DURATION_MS).
  const [isOpen, setIsOpen] = useState(false);
  const [isShown, setIsShown] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  // A mouse opens the panel by hovering, so its click must not close it again.
  const isOpenedByHoverRef = useRef(false);
  const panelId = useId();

  useEffect(() => () => clearTimeout(timerRef.current), []);

  function setOpen(next: boolean) {
    clearTimeout(timerRef.current);
    setIsOpen(next);
    if (!next) {
      setIsShown(false);
      return;
    }
    const prefersReducedMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    timerRef.current = setTimeout(
      () => setIsShown(true),
      prefersReducedMotion ? 0 : PRESS_DURATION_MS,
    );
  }

  return (
    <div
      className="order-2 md:relative md:order-2 pl-3"
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse" && !isOpen) {
          isOpenedByHoverRef.current = true;
          setOpen(true);
        }
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse") {
          isOpenedByHoverRef.current = false;
          setOpen(false);
        }
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setOpen(false);
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && isOpen) {
          setOpen(false);
          buttonRef.current?.focus();
        }
      }}
    >
      <Button
        ref={buttonRef}
        variant="accent"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => {
          if (isOpenedByHoverRef.current) {
            isOpenedByHoverRef.current = false;
            return;
          }
          setOpen(!isOpen);
        }}
        className="group relative animate-unpress bg-accent-yellow motion-reduce:animate-none aria-expanded:translate-x-1 aria-expanded:translate-y-1 aria-expanded:shadow-none"
      >
        <span className="relative inline-flex">
          <Sparkles
            aria-hidden="true"
            size={18}
            className="animate-twinkle motion-reduce:animate-none"
          />
          <Sparkles
            aria-hidden="true"
            size={9}
            className="absolute -top-1.5 -right-2 animate-twinkle [animation-delay:0.5s] motion-reduce:animate-none"
          />
          <Sparkles
            aria-hidden="true"
            size={7}
            className="absolute -right-1 -bottom-1.5 animate-twinkle [animation-delay:1s] motion-reduce:animate-none"
          />
        </span>
        <span className="max-sm:sr-only">{label}</span>
        <ChevronRight
          aria-hidden="true"
          size={16}
          className="shrink-0 transition-transform duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] group-aria-expanded:rotate-90 motion-reduce:transition-none"
        />
      </Button>
      <div
        id={panelId}
        hidden={!isShown}
        className="absolute inset-x-0 top-full z-[var(--z-dropdown)] pt-2 transition-[opacity,translate] duration-150 starting:-translate-y-1 starting:opacity-0 motion-reduce:transition-none md:inset-x-auto md:left-0 md:w-72"
      >
        <nav
          aria-label={navLabel}
          className="flex flex-col gap-3 rounded-standard border-2 border-border-strong bg-surface-card p-3 shadow-floating"
        >
          {children}
        </nav>
      </div>
    </div>
  );
}

/**
 * The top bar of the learning app.
 *
 * - Left: the panda logo and the name.
 * - Right: Facebook community, the dictionary search, notifications, score
 *   and profile.
 * - Below that: a scrollable bar with the highlighted English goals button,
 *   the "start learning" call to action, and the page nav links.
 *
 * Below `md` the main row wraps to two lines: the logo with the
 * notification, score and profile on the first, the search with the
 * community link on the second. It is a client
 * component, but every prop is plain data, so a Server Component layout can
 * render it.
 */
export function AppHeader({
  brandHref = "/",
  searchAction = "/dictionary",
  goalsHref = "/goals/english",
  learnHref = "/learn",
  facebookHref,
  notificationsHref = "/notifications",
  unreadNotifications = 0,
  score,
  profileHref = "/profile",
  bookmarksHref = "/bookmarks",
  settingsHref = "/settings",
  user,
  isSignedOut = false,
  signInHref = "/login",
  onLogout,
  profileBadge,
  navItems = defaultHeaderNavItems,
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
  const router = useRouter();
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const hasUnread = unreadNotifications > 0;
  const hasBadge = profileBadge !== undefined && profileBadge > 0;
  const isGoalsCurrent =
    pathname === goalsHref || !!pathname?.startsWith(`${goalsHref}/`);
  const isLearnCurrent =
    pathname === learnHref || !!pathname?.startsWith(`${learnHref}/`);

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

  return (
    <header
      ref={mergedRef}
      lang="vi"
      className={cn(
        "border-b border-border-default bg-surface-header",
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
        <div className="relative flex flex-wrap items-center gap-x-3 gap-y-2 py-2 md:h-16 md:flex-nowrap md:py-0">
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

          <ExploreMenu label={labels.explore} navLabel={labels.navigation}>
            <LinkButton
              href={goalsHref}
              variant="accent"
              leftIcon={GraduationCap}
              aria-current={isGoalsCurrent ? "page" : undefined}
              className={cn(
                "w-full justify-start bg-accent-pink",
                isGoalsCurrent && "translate-x-0.5 translate-y-0.5 shadow-none",
              )}
            >
              {labels.goals}
            </LinkButton>

            {navItems.map((item) => {
              const isCurrent =
                pathname === item.href ||
                (item.isSection && !!pathname?.startsWith(`${item.href}/`));
              return (
                <LinkButton
                  key={item.href}
                  href={item.href}
                  variant="accent"
                  leftIcon={item.icon}
                  aria-current={isCurrent ? "page" : undefined}
                  className={cn(
                    "h-auto min-h-[var(--height-default)] w-full justify-start py-2",
                    item.className,
                    isCurrent && "translate-x-0.5 translate-y-0.5 shadow-none",
                  )}
                >
                  {item.label}
                </LinkButton>
              );
            })}

            <LinkButton
              href={learnHref}
              variant="accent"
              aria-current={isLearnCurrent ? "page" : undefined}
              className={cn(
                "w-full justify-start",
                isLearnCurrent && "translate-x-0.5 translate-y-0.5 shadow-none",
              )}
            >
              <span aria-hidden="true">→</span>
              <span lang={labels.startLang}>{labels.start}</span>
              <span aria-hidden="true">♡</span>
              <span className="sr-only">{`(${labels.startMeaning})`}</span>
            </LinkButton>
          </ExploreMenu>

          {/* Below md this row is the second line; from md its children join the main row. */}
          <div className="order-3 flex w-full items-center gap-2 md:contents">
            <form
              role="search"
              action={searchAction}
              method="get"
              className="min-w-0 flex-1 md:order-4 md:ml-auto md:max-w-56"
            >
              <SearchInput
                name="q"
                aria-label={labels.dictionary}
                placeholder={labels.dictionary}
                autoComplete="off"
                className="shadow-raised animate-unpress transition-[background-color,box-shadow,translate] [animation-delay:120ms] motion-reduce:animate-none focus-within:translate-x-0.5 focus-within:translate-y-0.5 focus-within:shadow-none motion-reduce:transition-none"
              />
            </form>
          </div>

          <div className="order-2 ml-auto flex items-center gap-3 md:order-5 md:ml-0">
            <LinkButton
              href={notificationsHref}
              variant="secondary"
              leftIcon={Bell}
              aria-label={
                hasUnread ? labels.notificationsUnread : labels.notifications
              }
              className="aspect-square animate-unpress px-0 [animation-delay:240ms] motion-reduce:animate-none"
            >
              {hasUnread && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-1 -right-1 size-3 rounded-pill border-2 border-border-strong bg-danger-text"
                />
              )}
            </LinkButton>

            {score !== undefined && (
              <Badge variant="yellow" icon={Zap} className="font-semibold">
                <span aria-hidden="true">{score}</span>
                <span className="sr-only">{fill(labels.score, score)}</span>
              </Badge>
            )}

            {isSignedOut ? (
              <LinkButton
                href={signInHref}
                leftIcon={LogIn}
                className="animate-unpress bg-accent-lime text-ink [animation-delay:360ms] hover:bg-accent-lime active:bg-accent-lime motion-reduce:animate-none"
              >
                {labels.signIn}
              </LinkButton>
            ) : (
              <DropdownMenu>
                <MenuTrigger>
                  <button
                    type="button"
                    aria-label={
                      hasBadge
                        ? `${labels.profile}, ${fill(labels.profileBadge, profileBadge)}`
                        : labels.profile
                    }
                    className={cn(
                      "relative inline-flex size-11 cursor-pointer items-center justify-center rounded-pill",
                      focusRingClasses,
                    )}
                  >
                    <PandaIcon className="size-9" />
                    {hasBadge && (
                      <Badge
                        variant="danger"
                        size="sm"
                        aria-hidden="true"
                        className="absolute top-0 right-0 min-w-5 justify-center px-1 ring-2 ring-surface-header"
                      >
                        {profileBadge}
                      </Badge>
                    )}
                  </button>
                </MenuTrigger>
                {/* From md it hangs under the avatar and grows from its corner; on phones it is a sheet along the bottom edge. */}
                <MenuContent
                  align="end"
                  className={cn(
                    "w-72 origin-top-right transition-[opacity,scale,translate] duration-[var(--duration-fast)] starting:scale-95 starting:opacity-0 motion-reduce:transition-none",
                    "max-md:fixed max-md:inset-x-0 max-md:top-auto max-md:bottom-0 max-md:mt-0 max-md:w-full max-md:origin-bottom max-md:rounded-b-none max-md:pb-[max(0.25rem,env(safe-area-inset-bottom))] max-md:starting:translate-y-4 max-md:starting:scale-100",
                  )}
                >
                  {user && (
                    <div
                      role="presentation"
                      className="mb-1 flex items-center gap-3 rounded-standard border-2 border-border-strong bg-accent-lime p-3 text-ink"
                    >
                      <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-pill border-2 border-border-strong bg-surface-card">
                        <PandaIcon className="size-8" />
                      </span>
                      <div className="min-w-0">
                        <p className="m-0 truncate font-display text-body-md font-bold">
                          {user.name}
                        </p>
                        <p className="m-0 truncate font-body text-body-sm">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  )}
                  <MenuLabel>{labels.accountPages}</MenuLabel>
                  <MenuItem
                    icon={User}
                    onSelect={() => router.push(profileHref)}
                  >
                    {labels.profileInfo}
                  </MenuItem>
                  <MenuItem
                    icon={Bookmark}
                    onSelect={() => router.push(bookmarksHref)}
                  >
                    {labels.bookmarks}
                  </MenuItem>
                  <MenuItem
                    icon={Settings}
                    onSelect={() => router.push(settingsHref)}
                  >
                    {labels.settings}
                  </MenuItem>
                  <MenuSeparator />
                  <MenuLabel>{labels.accountPreferences}</MenuLabel>
                  {/* A switch in a menu: it stays open so the change can be seen. */}
                  <MenuItem
                    role="menuitemcheckbox"
                    aria-checked={theme === "dark"}
                    icon={theme === "dark" ? Moon : Sun}
                    // The switch already shows its state, so no hover fill.
                    className="focus:bg-transparent focus:text-text-primary"
                    onClick={(event) => {
                      event.preventDefault();
                      toggleTheme();
                    }}
                  >
                    <span className="flex items-center justify-between gap-3">
                      {labels.darkMode}
                      <span
                        aria-hidden="true"
                        className="inline-flex items-center gap-2 font-body text-caption font-semibold"
                      >
                        {theme === "dark" ? labels.themeOn : labels.themeOff}
                        <span
                          className={cn(
                            "relative h-5 w-9 rounded-pill border-2 border-border-strong transition-colors duration-[var(--duration-fast)] motion-reduce:transition-none",
                            theme === "dark"
                              ? "bg-accent-lime"
                              : "bg-surface-card",
                          )}
                        >
                          <span
                            className={cn(
                              "absolute top-0.5 left-0.5 size-3 rounded-pill bg-border-strong transition-transform duration-[var(--duration-fast)] motion-reduce:transition-none",
                              theme === "dark" && "translate-x-4",
                            )}
                          />
                        </span>
                      </span>
                    </span>
                  </MenuItem>
                  <MenuSeparator />
                  <MenuItem
                    icon={LogOut}
                    destructive
                    onSelect={() => setIsLogoutOpen(true)}
                  >
                    {labels.logout}
                  </MenuItem>
                </MenuContent>
              </DropdownMenu>
            )}
            {facebookHref && (
              <LinkButton
                href={facebookHref}
                external
                externalLabel={labels.opensInNewTab}
                variant="secondary"
                className="aspect-square animate-unpress px-0 [animation-delay:480ms] motion-reduce:animate-none"
              >
                <FacebookIcon className="size-5 shrink-0" />
                <span className="sr-only">{labels.facebook}</span>
              </LinkButton>
            )}
          </div>
        </div>
      </Container>
      <AlertDialog
        open={isLogoutOpen}
        variant="destructive"
        title={labels.logoutTitle}
        description={labels.logoutDescription}
        confirmLabel={labels.logoutConfirm}
        cancelLabel={labels.logoutCancel}
        onCancel={() => setIsLogoutOpen(false)}
        onConfirm={() => {
          setIsLogoutOpen(false);
          onLogout?.();
        }}
      />
    </header>
  );
}
