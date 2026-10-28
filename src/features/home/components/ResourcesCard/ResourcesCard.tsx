import { useId, type ComponentProps } from "react";
import { ExternalLink, Link2 } from "lucide-react";
import { Card, Image, Text, cn, focusRingClasses } from "@/design-system";
import type { HomeResource } from "../../resources";

export interface ResourcesCardProps extends Omit<
  ComponentProps<"section">,
  "children" | "ref"
> {
  resources: HomeResource[];
}

/** Where a site keeps its icon, through a favicon service that needs only the domain. */
function faviconUrl(href: string) {
  const { hostname } = new URL(href);
  return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
}

/** Links to documentation; each opens in a new tab with the site's icon. */
export function ResourcesCard({
  resources,
  className,
  ...props
}: ResourcesCardProps) {
  const titleId = useId();

  return (
    <Card
      as="section"
      aria-labelledby={titleId}
      className={cn("rounded-soft", className)}
      {...props}
    >
      <Text as="h2" id={titleId} size="heading-md" weight="semibold">
        Tài nguyên
      </Text>
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {resources.map((resource) => (
          <li key={resource.id}>
            <a
              href={resource.href}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-standard border-2 border-transparent p-2 hover:border-border-strong hover:bg-surface-sunken",
                focusRingClasses,
              )}
            >
              <Image
                src={faviconUrl(resource.href)}
                alt=""
                aspectRatio="square"
                radius="none"
                frameClassName="size-8 shrink-0"
                fallback={<Link2 aria-hidden="true" size={16} />}
              />
              <span className="flex min-w-0 flex-1 flex-col">
                <Text as="span" size="body-md" weight="medium">
                  {resource.title}
                  <span className="sr-only"> (mở trong tab mới)</span>
                </Text>
                <Text
                  as="span"
                  size="caption"
                  color="secondary"
                  className="truncate"
                >
                  {resource.description}
                </Text>
              </span>
              <ExternalLink
                aria-hidden="true"
                size={16}
                className="shrink-0 text-text-muted"
              />
            </a>
          </li>
        ))}
      </ul>
    </Card>
  );
}
