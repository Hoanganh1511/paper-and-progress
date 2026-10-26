import { type ComponentProps } from "react";
import { ArrowUpRight, MessageCircle } from "lucide-react";
import { Container, LinkButton, Stack, Text, cn } from "@/design-system";
import { FacebookIcon } from "@/features/header";
import { FooterLink } from "../FooterLink";

export interface AppFooterLabels {
  /** Heading of the middle column. */
  linksHeading: string;
  zalo: string;
  community: string;
  fanpage: string;
  fanpageDescription: string;
  follow: string;
  /** Screen-reader hint added to every link that opens a new tab. */
  opensInNewTab: string;
}

export const defaultAppFooterLabels: AppFooterLabels = {
  linksHeading: "Học tập & hỗ trợ",
  zalo: "Nhóm Zalo hỗ trợ",
  community: "Cộng đồng Facebook học tập",
  fanpage: "Fanpage DUA Edu",
  fanpageDescription:
    "Cập nhật tài liệu, sự kiện và những câu chuyện học tập mới nhất.",
  follow: "Theo dõi DUA Edu",
  opensInNewTab: "(mở trong tab mới)",
};

export interface AppFooterProps extends ComponentProps<"footer"> {
  /** Product name, left column. */
  productName?: string;
  /** Maker line after the product name. */
  byline?: string;
  /** Each external link is left out when its address is missing. */
  zaloHref?: string;
  communityHref?: string;
  fanpageHref?: string;
  /** Replace any of the texts (translations). */
  labels?: Partial<AppFooterLabels>;
}

/**
 * The page footer, in three columns from `md` (stacked below that):
 * the product and its maker, links for learning and support, and a call to
 * follow the publisher's fanpage. Every external link opens a new tab and
 * says so. Nothing here needs JavaScript, so it also works as a Server
 * Component.
 */
export function AppFooter({
  productName = "DataLab",
  byline = "Một sản phẩm của DUA Edu",
  zaloHref,
  communityHref,
  fanpageHref,
  labels: labelOverrides,
  className,
  ...props
}: AppFooterProps) {
  const labels = { ...defaultAppFooterLabels, ...labelOverrides };
  const hasLinks = Boolean(zaloHref || communityHref);

  return (
    <footer
      lang="vi"
      className={cn(
        "border-t border-border-default bg-surface-sunken",
        className,
      )}
      {...props}
    >
      <Container size="wide">
        <div className="grid gap-8 py-10 md:grid-cols-3 md:gap-10">
          <Text size="body-sm" color="secondary">
            <span className="font-medium text-text-primary">{productName}</span>
            {" · "}
            {byline}
          </Text>

          {hasLinks && (
            <nav aria-labelledby="footer-links-heading">
              <Stack gap={1}>
                <Text
                  as="h2"
                  id="footer-links-heading"
                  size="body-md"
                  weight="bold"
                >
                  {labels.linksHeading}
                </Text>
                <ul className="flex flex-col">
                  {zaloHref && (
                    <li>
                      <FooterLink
                        href={zaloHref}
                        externalLabel={labels.opensInNewTab}
                        icon={<MessageCircle size={20} />}
                      >
                        {labels.zalo}
                      </FooterLink>
                    </li>
                  )}
                  {communityHref && (
                    <li>
                      <FooterLink
                        href={communityHref}
                        externalLabel={labels.opensInNewTab}
                        icon={<FacebookIcon className="size-5" />}
                      >
                        {labels.community}
                      </FooterLink>
                    </li>
                  )}
                </ul>
              </Stack>
            </nav>
          )}

          {fanpageHref && (
            <Stack gap={3} align="start">
              <FooterLink
                href={fanpageHref}
                externalLabel={labels.opensInNewTab}
                className="font-bold"
              >
                {labels.fanpage}
              </FooterLink>
              <Text size="body-sm" color="secondary">
                {labels.fanpageDescription}
              </Text>
              <LinkButton
                href={fanpageHref}
                external
                externalLabel={labels.opensInNewTab}
                variant="accent"
                rightIcon={ArrowUpRight}
              >
                {labels.follow}
              </LinkButton>
            </Stack>
          )}
        </div>
      </Container>
    </footer>
  );
}
