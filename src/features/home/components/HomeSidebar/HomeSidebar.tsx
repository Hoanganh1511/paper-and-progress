import { GraduationCap, Laptop } from "lucide-react";
import type { ComponentProps } from "react";
import { Card, LinkButton, Text, cn } from "@/design-system";
import { Mascot } from "@/features/english";

export type HomeSidebarProps = Omit<ComponentProps<"aside">, "children">;

/**
 * The left column of the home page. It greets the visitor ("Bạn muốn làm gì
 * hôm nay?", with the mascot) and, under a "Khám phá" heading, stacks the same
 * three buttons as the header's Khám phá menu. It sits higher than the cards
 * beside it (a 6px hard shadow against their 2px) and stays in view while the
 * page scrolls on wide screens.
 */
export function HomeSidebar({ className, ...props }: HomeSidebarProps) {
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
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <Text as="h1" size="heading-md" weight="semibold">
              Bạn muốn làm gì hôm nay?
            </Text>
            <Text as="p" size="body-md" color="secondary">
              Chọn một lối đi để bắt đầu.
            </Text>
          </div>
          <Mascot
            accessory="speech"
            aria-hidden="true"
            className="size-20 shrink-0"
          />
        </div>
        <hr className="border-t-2 border-border-strong" />
        <Text
          as="h2"
          id="home-sidebar-title"
          size="heading-sm"
          weight="semibold"
        >
          Khám phá
        </Text>
        <nav aria-label="Khám phá">
          <ul className="flex flex-col gap-4">
            <li className="flex flex-col gap-2">
              <Text as="h3" size="body-sm" weight="semibold" color="secondary">
                Ngôn ngữ
              </Text>
              <LinkButton
                href="/goals/english"
                variant="accent"
                leftIcon={GraduationCap}
                className="h-auto min-h-[var(--height-default)] w-full justify-start py-2 bg-accent-pink"
              >
                Tiếng Anh
              </LinkButton>
            </li>
            <li className="flex flex-col gap-2">
              <Text as="h3" size="body-sm" weight="semibold" color="secondary">
                Công nghệ
              </Text>
              <LinkButton
                href="/goals/tech"
                variant="accent"
                leftIcon={Laptop}
                className="h-auto min-h-[var(--height-default)] w-full justify-start py-2 bg-accent-yellow"
              >
                Công nghệ thông tin
              </LinkButton>
            </li>
            <li className="flex flex-col gap-2">
              <Text as="h3" size="body-sm" weight="semibold" color="secondary">
                Bắt đầu
              </Text>
              <LinkButton
                href="/learn"
                variant="accent"
                className="h-auto min-h-[var(--height-default)] w-full justify-start py-2"
              >
                <span aria-hidden="true">→</span>
                <span lang="vi">Học tập</span>
                <span aria-hidden="true">♡</span>
                <span className="sr-only">(Bắt đầu học từ đây)</span>
              </LinkButton>
            </li>
          </ul>
        </nav>
      </Card>
    </aside>
  );
}
