import type { ComponentProps } from "react";
import {
  FileText,
  ListChecks,
  SquareTerminal,
  Video,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/design-system";
import type { BookmarkContentType, BookmarkDomain } from "../../types";

const CONTENT_ICONS: Record<BookmarkContentType, LucideIcon> = {
  video: Video,
  text: FileText,
  quiz: ListChecks,
  "code-lab": SquareTerminal,
};

const DOMAIN_TINTS: Record<BookmarkDomain, string> = {
  it: "bg-accent-blue",
  english: "bg-accent-pink",
  "life-skills": "bg-accent-yellow",
};

export interface BookmarkThumbnailProps extends Omit<
  ComponentProps<"div">,
  "children"
> {
  contentType: BookmarkContentType;
  domain: BookmarkDomain;
}

/**
 * Stands in for a lesson's cover: a tinted tile (by domain) with the icon of
 * its content type. Purely decorative, so it is hidden from assistive tech;
 * the content type and domain are written out in text beside it.
 */
export function BookmarkThumbnail({
  contentType,
  domain,
  className,
  ...props
}: BookmarkThumbnailProps) {
  const Icon = CONTENT_ICONS[contentType];

  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex items-center justify-center text-ink",
        DOMAIN_TINTS[domain],
        className,
      )}
      {...props}
    >
      <Icon size={28} strokeWidth={1.75} />
    </div>
  );
}
