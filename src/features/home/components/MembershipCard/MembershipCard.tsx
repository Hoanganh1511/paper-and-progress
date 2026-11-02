"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Crown, Sparkles } from "lucide-react";
import { Badge, LinkButton, Skeleton, Text } from "@/design-system";
import { useAuth } from "@/features/auth";
import { getMyMembership, type MembershipStatus } from "@/features/membership";

const date = new Intl.DateTimeFormat("vi-VN", { dateStyle: "long" });

/**
 * The membership card of the sidebar, under "Về tôi": a lime frame round a
 * white panel, so it stands out from the rest of the sidebar. It invites with
 * what membership unlocks, never with a price: the plans come on the
 * membership page. Its content follows the account: Free (or signed out),
 * member, or expired.
 */
export function MembershipCard() {
  const { isAuthenticated, isLoading } = useAuth();
  const [status, setStatus] = useState<MembershipStatus>();

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    let isCurrent = true;
    // If the status cannot be read, the card stays the plain invitation: no claim is made.
    getMyMembership()
      .then((data) => isCurrent && setStatus(data))
      .catch(() => undefined);
    return () => {
      isCurrent = false;
    };
  }, [isAuthenticated, isLoading]);

  const isChecking = isLoading || (isAuthenticated && !status);
  const isMember = status?.isMember === true;
  const isExpired = !isMember && status?.expiresAt != null;
  const endDate = status?.expiresAt
    ? date.format(new Date(status.expiresAt))
    : "";

  return (
    <section
      aria-labelledby="membership-card-title"
      className="relative rounded-standard border-2 border-border-strong bg-accent-lime p-1.5 shadow-floating"
    >
      <Sparkles
        aria-hidden="true"
        size={20}
        className="absolute -top-3 -left-2 text-accent-yellow drop-shadow-[1px_1px_0_var(--color-border-strong)]"
      />
      <div className="flex flex-col gap-3 rounded-sharp bg-surface-card p-3">
        <div className="flex items-center justify-between gap-2">
          <Text
            as="h2"
            id="membership-card-title"
            size="body-md"
            weight="bold"
            className="flex min-w-0 items-center gap-2 font-display"
          >
            <Crown aria-hidden="true" size={18} className="shrink-0" />
            Baolingo Membership
          </Text>
          {!isChecking && isAuthenticated && (
            <Badge variant={isMember ? "success" : "yellow"} size="sm">
              {isMember ? "Hội viên" : isExpired ? "Hết hạn" : "Free"}
            </Badge>
          )}
        </div>
        {isChecking ? (
          <Skeleton className="h-16 w-full" />
        ) : isMember ? (
          <>
            <Text size="body-sm" color="secondary">
              Bạn đọc được toàn bộ bài viết. Hết hạn ngày {endDate}.
            </Text>
            <LinkButton
              href="/membership"
              variant="outline"
              rightIcon={ArrowRight}
              className="w-full justify-between"
            >
              Xem hội viên
            </LinkButton>
          </>
        ) : isExpired ? (
          <>
            <Text size="body-sm" color="secondary">
              Hội viên của bạn đã hết hạn ngày {endDate}. Gia hạn để đọc tiếp
              toàn bộ bài viết.
            </Text>
            <LinkButton
              href="/membership"
              variant="outline"
              rightIcon={ArrowRight}
              className="w-full justify-between"
            >
              Gia hạn hội viên
            </LinkButton>
          </>
        ) : (
          <>
            <Text size="body-sm" color="secondary">
              Mở khóa toàn bộ bài viết và nội dung dành riêng cho hội viên.
            </Text>
            <LinkButton
              href="/membership"
              variant="outline"
              rightIcon={ArrowRight}
              className="w-full justify-between"
            >
              Khám phá quyền lợi
            </LinkButton>
          </>
        )}
      </div>
    </section>
  );
}
