import {
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  cn,
} from "@/design-system";
import type { LoginRecord } from "../adminApi";
import { formatDateTime } from "../format";
import { TableMessage } from "./TableMessage";

export interface LoginHistoryTableProps {
  items?: LoginRecord[];
  /** Leave out the email column when every row is the same user. */
  showUser?: boolean;
  isLoading?: boolean;
}

/** Login rows; an IP the user had never signed in from before is highlighted and badged "IP mới". */
export function LoginHistoryTable({
  items,
  showUser = true,
  isLoading = false,
}: LoginHistoryTableProps) {
  const columns = showUser ? 4 : 3;
  return (
    <Table compact aria-busy={isLoading}>
      <TableHeader>
        <TableRow>
          {showUser && <TableHead>Email</TableHead>}
          <TableHead>IP</TableHead>
          <TableHead>User agent</TableHead>
          <TableHead>Thời gian</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className={cn(isLoading && "opacity-60")}>
        {items?.map((login) => (
          <TableRow
            key={login.id}
            className={cn(login.isNewIp && "bg-warning-bg")}
          >
            {showUser && <TableCell>{login.user.email}</TableCell>}
            <TableCell>
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-mono">{login.ip}</span>
                {login.isNewIp && (
                  <Badge variant="warning" size="sm">
                    IP mới
                  </Badge>
                )}
              </span>
            </TableCell>
            <TableCell
              className="max-w-xs truncate"
              title={login.userAgent ?? undefined}
            >
              {login.userAgent ?? "—"}
            </TableCell>
            <TableCell className="whitespace-nowrap">
              {formatDateTime(login.createdAt)}
            </TableCell>
          </TableRow>
        ))}
        {items?.length === 0 && (
          <TableMessage colSpan={columns}>
            Không có lượt đăng nhập nào.
          </TableMessage>
        )}
        {!items && <TableMessage colSpan={columns}>Đang tải...</TableMessage>}
      </TableBody>
    </Table>
  );
}
