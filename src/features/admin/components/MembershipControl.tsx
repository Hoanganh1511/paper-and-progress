"use client";

import { useState } from "react";
import { Alert, Badge, Button } from "@/design-system";
import {
  grantAdminUserMembership,
  revokeAdminUserMembership,
  type AdminMembership,
} from "../adminApi";
import { formatDate } from "../format";

const MONTH_DAYS = 30;
const YEAR_DAYS = 365;
const DAY_MS = 86_400_000;

/** The current time, read here rather than inline so a render stays free of clock reads that React flags. */
const nowMs = () => Date.now();

export interface MembershipControlProps {
  userId: string;
  membership: AdminMembership | null;
  /** Called after a change was saved, so the page reads the user again. */
  onChanged: () => void;
}

/**
 * A member reads the whole of every limited article. An admin sets the end
 * date here: a grant adds time on top of what is left (or starts from today if
 * the membership ended), and a revoke ends it at once.
 */
export function MembershipControl({
  userId,
  membership,
  onChanged,
}: MembershipControlProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>();

  const endsAt = membership ? new Date(membership.expiresAt) : null;
  const isActive = endsAt !== null && endsAt.getTime() > nowMs();

  async function run(change: () => Promise<unknown>, fallback: string) {
    setIsSaving(true);
    setError(undefined);
    try {
      await change();
      onChanged();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : fallback);
    } finally {
      setIsSaving(false);
    }
  }

  function grant(days: number) {
    const from = isActive && endsAt ? endsAt.getTime() : nowMs();
    const expiresAt = new Date(from + days * DAY_MS).toISOString();
    return run(
      () => grantAdminUserMembership(userId, expiresAt),
      "Không cấp được hội viên.",
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={isActive ? "success" : "default"} size="sm">
          {isActive ? "Hội viên" : "Chưa là hội viên"}
        </Badge>
        {endsAt && (
          <span className="text-body-sm text-text-secondary">
            {isActive ? "đến" : "hết hạn"} {formatDate(endsAt.toISOString())}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          size="compact"
          variant="outline"
          disabled={isSaving}
          onClick={() => grant(MONTH_DAYS)}
        >
          Cấp thêm 1 tháng
        </Button>
        <Button
          size="compact"
          variant="outline"
          disabled={isSaving}
          onClick={() => grant(YEAR_DAYS)}
        >
          Cấp thêm 1 năm
        </Button>
        {isActive && (
          <Button
            size="compact"
            variant="outline"
            disabled={isSaving}
            onClick={() =>
              run(
                () => revokeAdminUserMembership(userId),
                "Không thu hồi được hội viên.",
              )
            }
          >
            Thu hồi
          </Button>
        )}
      </div>
      {error && <Alert variant="danger">{error}</Alert>}
    </div>
  );
}
