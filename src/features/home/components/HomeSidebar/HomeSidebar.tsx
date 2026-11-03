import {
  Award,
  BookMarked,
  BookOpenText,
  GraduationCap,
  Laptop,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { Card, LinkButton, Text, cn } from "@/design-system";
import { AboutMeCard } from "../AboutMeCard";
import { MembershipCard } from "../MembershipCard";

export interface HomeSidebarProps extends Omit<
  ComponentProps<"aside">,
  "children"
> {
  /**
   * The page's own title, for screen readers (an h1 nobody sees). A page that
   * has a visible h1 of its own passes `false`, so it keeps only one.
   */
  pageTitle?: string | false;
}

interface ExploreLinkProps {
  href: string;
  /** What fills the icon place: from `lg` the icon sits left of the name, below it top right of the tile. */
  icon: ReactNode;
  /** The colour of the button. */
  tone: string;
  /** The small English line under the name on a tile; the bars of `lg` do not show it. */
  subtitle: string;
  children: ReactNode;
}

/**
 * One way into the app. From `lg` it is a bar (an icon, then the name). Below
 * `lg` it is a tile: the icon large in the top right corner, the name in bold
 * at the bottom with a small English line under it, so two fit side by side on
 * a phone. The English line only decorates; it is not part of the link's name.
 */
function ExploreLink({
  href,
  icon,
  tone,
  subtitle,
  children,
}: ExploreLinkProps) {
  return (
    <LinkButton
      href={href}
      variant="accent"
      className={cn(
        "h-auto min-h-[var(--height-default)] w-full justify-start py-2",
        "max-lg:min-h-36 max-lg:flex-1 max-lg:flex-col max-lg:items-stretch max-lg:justify-between max-lg:gap-3 max-lg:rounded-2xl max-lg:p-4 max-lg:whitespace-normal max-lg:shadow-[4px_4px_0_0_var(--color-border-strong)]",
        tone,
      )}
    >
      {icon}
      <span className="flex flex-col text-left max-lg:text-heading-sm max-lg:leading-tight max-lg:font-bold">
        <span className="flex items-center gap-2">{children}</span>
        <span
          lang="en"
          aria-hidden="true"
          className="hidden text-body-sm font-normal text-ink/70 max-lg:mt-1 max-lg:block"
        >
          {subtitle}
        </span>
      </span>
    </LinkButton>
  );
}

/** The icon of an `ExploreLink`: 16px on a bar, 40px in the top right of a tile. */
function ExploreIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <Icon
      aria-hidden="true"
      size={16}
      className="shrink-0 max-lg:size-10 max-lg:self-end"
    />
  );
}

/**
 * The left column of the home page. Under a "Khám phá" heading it has the same
 * ways in as the header's Khám phá menu, then the owner's card and the
 * membership card. From `lg` they are bars under three small headings; below
 * `lg` they are a grid of colourful tiles (two across on a phone, three across
 * from `sm`) and the three small headings are left to screen readers. It sits
 * higher than the cards beside it (a 6px hard shadow against their 2px) and
 * stays in view while the page scrolls on wide screens.
 */
export function HomeSidebar({
  pageTitle = "Trang chủ",
  className,
  ...props
}: HomeSidebarProps) {
  return (
    <aside
      aria-labelledby="home-sidebar-title"
      className={cn(
        "lg:sticky lg:top-[calc(var(--app-header-height,0px)+1.5rem)] lg:self-start",
        className,
      )}
      {...props}
    >
      <Card className="gap-5 rounded-soft shadow-modal" lang="vi">
        {pageTitle !== false && <h1 className="sr-only">{pageTitle}</h1>}
        <Text
          as="h2"
          id="home-sidebar-title"
          size="heading-sm"
          weight="semibold"
          className="max-lg:text-heading-lg max-lg:font-bold"
        >
          Khám phá
          <Sparkles
            aria-hidden="true"
            size={22}
            className="ml-2 inline-block fill-accent-yellow align-top text-text-primary"
          />
        </Text>
        <nav aria-label="Khám phá">
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:flex lg:flex-col lg:gap-4">
            {/* Two tiles share a row under lg: the language group, and the start group below. */}
            <li className="col-span-2 grid grid-cols-2 gap-3 lg:flex lg:flex-col lg:gap-2">
              <Text
                as="h3"
                size="body-sm"
                weight="semibold"
                color="secondary"
                className="max-lg:sr-only"
              >
                Ngôn ngữ
              </Text>
              <ExploreLink
                href="/goals/english"
                icon={<ExploreIcon icon={GraduationCap} />}
                tone="bg-accent-pink"
                subtitle="Language"
              >
                English Diary
              </ExploreLink>
              <ExploreLink
                href="/goals/english/diary"
                icon={<ExploreIcon icon={BookOpenText} />}
                tone="bg-accent-pink"
                subtitle="Daily practice"
              >
                English Logs
              </ExploreLink>
            </li>
            <li className="col-span-2 flex flex-col gap-2 sm:col-span-1">
              <Text
                as="h3"
                size="body-sm"
                weight="semibold"
                color="secondary"
                className="max-lg:sr-only"
              >
                Công nghệ
              </Text>
              <ExploreLink
                href="/goals/tech"
                icon={<ExploreIcon icon={Laptop} />}
                tone="bg-accent-yellow"
                subtitle="Technology"
              >
                Công nghệ thông tin
              </ExploreLink>
            </li>
            <li className="col-span-2 grid grid-cols-2 gap-3 sm:col-span-3 lg:flex lg:flex-col lg:gap-2">
              <Text
                as="h3"
                size="body-sm"
                weight="semibold"
                color="secondary"
                className="max-lg:sr-only"
              >
                Bắt đầu
              </Text>
              <ExploreLink
                href="/learn"
                icon={
                  <>
                    <span aria-hidden="true" className="max-lg:hidden">
                      →
                    </span>
                    <BookMarked
                      aria-hidden="true"
                      size={40}
                      className="shrink-0 self-end lg:hidden"
                    />
                  </>
                }
                tone=""
                subtitle="Learning space"
              >
                <span lang="vi">Học tập</span>
                <span aria-hidden="true">♡</span>
                <span className="sr-only">(Bắt đầu học từ đây)</span>
              </ExploreLink>
              <ExploreLink
                href="/certificates"
                icon={<ExploreIcon icon={Award} />}
                tone=""
                subtitle="Certificates"
              >
                Chứng chỉ
              </ExploreLink>
            </li>
          </ul>
        </nav>
        {/* On a phone the sidebar would push the page down, so these two stay on wide screens. */}
        <div className="flex flex-col gap-5 max-lg:hidden">
          <hr className="border-t-2 border-border-strong" />
          <AboutMeCard />
          <MembershipCard />
        </div>
      </Card>
    </aside>
  );
}
