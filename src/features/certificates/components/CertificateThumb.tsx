import { Award } from "lucide-react";
import { Image, cn } from "@/design-system";
import type { CertificateStatus } from "../types";

const TONE: Record<CertificateStatus, string> = {
  ACHIEVED: "bg-accent-lime/40",
  STUDYING: "bg-accent-blue/40",
  PLANNED: "bg-accent-yellow/40",
};

export interface CertificateThumbProps {
  imageUrl: string | null;
  name: string;
  status: CertificateStatus;
  className?: string;
}

/** The certificate's picture, or a badge icon on its status colour while there is no link yet. */
export function CertificateThumb({
  imageUrl,
  name,
  status,
  className,
}: CertificateThumbProps) {
  if (imageUrl) {
    return (
      <Image
        src={imageUrl}
        alt={`Ảnh chứng chỉ ${name}`}
        fit="contain"
        radius="sharp"
        className={cn("bg-surface-card", className)}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex items-center justify-center text-ink",
        TONE[status],
        className,
      )}
    >
      <Award size={36} />
    </span>
  );
}
