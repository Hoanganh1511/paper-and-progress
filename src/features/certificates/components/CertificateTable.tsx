import Link from "next/link";
import {
  Badge,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/design-system";
import { STATUS_INFO, formatDate } from "../format";
import type { CertificateSummary } from "../types";

/** "Điểm / Tiến độ": the score once achieved, the progress while studying. */
function scoreOrProgress(item: CertificateSummary) {
  if (item.status === "ACHIEVED") return item.score ?? "—";
  if (item.status === "STUDYING") return `${item.progress}%`;
  return "—";
}

/** The date that matters for the status: achieved on, started on, or planned to start. */
const dateOf = (item: CertificateSummary) =>
  formatDate(item.status === "ACHIEVED" ? item.issuedAt : item.startDate);

export function CertificateTable({
  certificates,
}: {
  certificates: readonly CertificateSummary[];
}) {
  return (
    <Table hoverable>
      <TableCaption className="sr-only">Danh sách chứng chỉ</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Tên chứng chỉ</TableHead>
          <TableHead>Tổ chức cấp</TableHead>
          <TableHead>Trạng thái</TableHead>
          <TableHead>Tiến độ / Điểm</TableHead>
          <TableHead>Ngày</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {certificates.map((item) => {
          const info = STATUS_INFO[item.status];
          return (
            <TableRow key={item.id}>
              <TableCell>
                <Link
                  href={`/certificates/${item.id}`}
                  className="font-semibold underline-offset-4 hover:underline"
                >
                  {item.name}
                </Link>
              </TableCell>
              <TableCell>{item.issuer}</TableCell>
              <TableCell>
                <Badge variant={info.variant} icon={info.icon} size="sm">
                  {info.badge}
                </Badge>
              </TableCell>
              <TableCell>{scoreOrProgress(item)}</TableCell>
              <TableCell>{dateOf(item)}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
