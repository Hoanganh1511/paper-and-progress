import Link from "next/link";
import { Lock } from "lucide-react";
import { Text, buttonVariants, cn } from "@/design-system";
import { ArticleBody } from "./ArticleBody";

export interface GatedOverlayProps {
  /** Where "Đăng nhập" leads; it brings the reader back to this article afterwards. */
  signInHref?: string;
  /** The first part of the article, cut by the server. */
  previewHtml?: string;
  /** For a members-only article there is no text, only this notice. */
  excerpt?: string | null;
}

/**
 * What a guest sees of a preview or members-only article: the start of the text
 * fading out (when there is one), then a card asking them to sign in.
 */
export function GatedOverlay({
  signInHref = "/login",
  previewHtml,
  excerpt,
}: GatedOverlayProps) {
  return (
    <div className="flex flex-col gap-6">
      {previewHtml ? (
        <div className="article-gated [mask-image:linear-gradient(to_bottom,black_55%,transparent)]">
          <ArticleBody html={previewHtml} />
        </div>
      ) : (
        excerpt && (
          <Text size="body-lg" color="secondary">
            {excerpt}
          </Text>
        )
      )}
      <div
        role="region"
        aria-label="Đăng nhập để đọc tiếp"
        className="flex flex-col items-center gap-3 rounded-standard border-2 border-border-strong bg-accent-yellow p-6 text-center text-ink shadow-floating"
      >
        <Lock aria-hidden="true" size={28} />
        <Text as="h2" size="heading-sm" weight="bold" className="font-display">
          Đăng nhập để đọc tiếp
        </Text>
        <Text size="body-md">
          {previewHtml
            ? "Bạn đang xem phần đầu của bài viết. Đăng nhập hoặc đăng ký miễn phí để đọc toàn bộ."
            : "Bài viết này dành cho thành viên. Đăng nhập hoặc đăng ký miễn phí để đọc."}
        </Text>
        <div className="flex flex-wrap justify-center gap-2">
          <Link
            href={signInHref}
            className={cn(buttonVariants({ variant: "primary" }))}
          >
            Đăng nhập
          </Link>
          <Link
            href="/register"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Đăng ký
          </Link>
        </div>
      </div>
    </div>
  );
}
