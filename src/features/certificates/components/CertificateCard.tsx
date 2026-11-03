import Link from "next/link";
import { ArrowUpRight, CalendarDays } from "lucide-react";
import {
  Badge,
  Card,
  ProgressBar,
  Text,
  cn,
  focusRingClasses,
} from "@/design-system";
import { STATUS_INFO, datesOf } from "../format";
import type { CertificateSummary } from "../types";
import { CertificateThumb } from "./CertificateThumb";

export interface CertificateCardProps {
  certificate: CertificateSummary;
  /** `Kế hoạch sắp tới` shows a plan as a single wide row. */
  isCompact?: boolean;
}

/** One certificate: its picture, name, issuer and status; the whole card opens the detail. */
export function CertificateCard({
  certificate,
  isCompact = false,
}: CertificateCardProps) {
  const info = STATUS_INFO[certificate.status];
  return (
    <Card
      as="article"
      interactive
      className={cn(
        "relative flex-row items-stretch gap-0 overflow-hidden p-0",
      )}
    >
      <CertificateThumb
        imageUrl={certificate.imageUrl}
        name={certificate.name}
        status={certificate.status}
        className={cn(
          "w-28 shrink-0 border-r-2 border-border-strong sm:w-40",
          isCompact && "w-20 sm:w-24",
        )}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Text
              as="h3"
              size="heading-sm"
              weight="bold"
              className="font-display"
            >
              <Link
                href={`/certificates/${certificate.id}`}
                className={cn(
                  "rounded-sharp after:absolute after:inset-0 after:content-['']",
                  focusRingClasses,
                )}
              >
                {certificate.name}
              </Link>
            </Text>
            <Text size="body-sm" color="secondary">
              {certificate.issuer}
            </Text>
          </div>
          <ArrowUpRight
            aria-hidden="true"
            size={18}
            className="mt-1 shrink-0 text-text-secondary"
          />
        </div>

        {certificate.status === "STUDYING" && (
          <ProgressBar
            value={certificate.progress}
            label={`Tiến độ ${certificate.name}`}
            showValue
          />
        )}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <ul className="flex flex-wrap gap-x-4 gap-y-1">
            {datesOf(certificate).map((line) => (
              <li
                key={line}
                className="flex items-center gap-1.5 text-body-sm text-text-secondary"
              >
                <CalendarDays aria-hidden="true" size={14} />
                {line}
              </li>
            ))}
          </ul>
          <Badge variant={info.variant} icon={info.icon}>
            {info.badge}
          </Badge>
        </div>
      </div>
    </Card>
  );
}
