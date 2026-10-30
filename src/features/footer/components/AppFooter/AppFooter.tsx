import { type ComponentProps } from "react";
import { MessageCircle } from "lucide-react";
import { Container, Stack, Text, cn } from "@/design-system";
import { FacebookIcon } from "@/features/header";
import { FooterLink } from "../FooterLink";

export interface AppFooterLabels {
  /** Heading of the middle column. */
  linksHeading: string;
  zalo: string;
  community: string;
  /** Screen-reader hint added to every link that opens a new tab. */
  opensInNewTab: string;
}

export const defaultAppFooterLabels: AppFooterLabels = {
  linksHeading: "Học tập & hỗ trợ",
  zalo: "Nhóm Zalo hỗ trợ",
  community: "Cộng đồng Facebook học tập",
  opensInNewTab: "(mở trong tab mới)",
};

export interface AppFooterProps extends ComponentProps<"footer"> {
  /** Product name, left column. */
  productName?: string;
  /** Optional line after the product name, e.g. a maker credit. */
  byline?: string;
  /** Each external link is left out when its address is missing. */
  zaloHref?: string;
  communityHref?: string;
  /** Replace any of the texts (translations). */
  labels?: Partial<AppFooterLabels>;
}

/**
 * The page footer, in two columns from `md` (stacked below that): the
 * product, and links for learning and support. Every external link opens a
 * new tab and says so. Nothing here needs JavaScript, so it also works as a Server
 * Component.
 */
export function AppFooter({
  productName = "Paper & Progress",
  byline,
  zaloHref,
  communityHref,
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
        <div className="grid gap-8 py-10 md:grid-cols-2 md:gap-10">
          <div className="flex flex-col gap-1">
            <Text
              as="p"
              size="heading-md"
              weight="bold"
              className="font-display tracking-tight"
            >
              {productName}
            </Text>
            {byline && (
              <Text as="p" size="body-sm" color="secondary">
                {byline}
              </Text>
            )}
          </div>

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
        </div>
      </Container>
    </footer>
  );
}
