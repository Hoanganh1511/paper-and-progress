import Link from "next/link";
import { Lock } from "lucide-react";
import { Text, buttonVariants, cn } from "@/design-system";
import { ArticleBody } from "./ArticleBody";

/**
 * Why the rest of the article is closed:
 * - `LOGIN`: a guest; they may already be a member, so signing in comes first.
 * - `MEMBERSHIP`: signed in, but not a member.
 * - `CHECKING`: signed in, and the server is still saying whether they are one.
 * - `UNKNOWN`: the check failed; no prompt, because none would be true.
 */
export type GatedOverlayReason =
  "LOGIN" | "MEMBERSHIP" | "CHECKING" | "UNKNOWN";

export interface GatedOverlayProps {
  /** Where "Đăng nhập" leads; it brings the reader back to this article afterwards. */
  signInHref?: string;
  /** Where "Đăng ký hội viên" leads. */
  membershipHref?: string;
  reason?: GatedOverlayReason;
  /** The first part of the article, cut by the server. */
  previewHtml?: string;
  /** For a members-only article there is no text, only this notice. */
  excerpt?: string | null;
}

/**
 * What someone who may not read the whole article sees: the start of the text
 * fading out (when there is one), then a card that says what unlocks the rest.
 * Only members read all of it; signing in alone does not.
 */
export function GatedOverlay({
  signInHref = "/login",
  membershipHref = "/membership",
  reason = "LOGIN",
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
      {reason === "UNKNOWN" ? null : reason === "CHECKING" ? (
        <Text role="status" color="secondary">
          Đang kiểm tra quyền đọc của bạn…
        </Text>
      ) : (
        <div
          role="region"
          aria-label="Dành cho hội viên"
          className="flex flex-col items-center gap-3 rounded-standard border-2 border-border-strong bg-accent-yellow p-6 text-center text-ink shadow-floating"
        >
          <Lock aria-hidden="true" size={28} />
          <Text
            as="h2"
            size="heading-sm"
            weight="bold"
            className="font-display"
          >
            {reason === "MEMBERSHIP"
              ? "Đăng ký hội viên để đọc tiếp"
              : "Bài viết dành cho hội viên"}
          </Text>
          <Text size="body-md">
            {reason === "MEMBERSHIP"
              ? "Tài khoản của bạn chưa là hội viên nên chỉ xem được phần đầu. Hội viên đọc được toàn bộ bài viết."
              : "Bạn đang xem phần đầu của bài viết. Đăng nhập nếu bạn đã là hội viên, hoặc đăng ký hội viên để đọc toàn bộ."}
          </Text>
          <div className="flex flex-wrap justify-center gap-2">
            {reason === "LOGIN" && (
              <Link
                href={signInHref}
                className={cn(buttonVariants({ variant: "primary" }))}
              >
                Đăng nhập
              </Link>
            )}
            <Link
              href={membershipHref}
              className={cn(
                buttonVariants({
                  variant: reason === "LOGIN" ? "outline" : "primary",
                }),
              )}
            >
              Đăng ký hội viên
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
