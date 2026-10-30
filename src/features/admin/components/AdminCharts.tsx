"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  SECURITY_EVENT_TYPES,
  type AdminStats,
  type SecurityEventType,
} from "../adminApi";
import { EVENT_LABELS, formatDayLabel } from "../format";

const INK = "var(--color-border-strong)";
const MUTED = "var(--color-text-secondary)";

/** Bar colours follow the badge colours of the events table. */
const EVENT_COLORS: Record<SecurityEventType, string> = {
  TOTP_FAIL: "var(--color-danger-text)",
  RECAPTCHA_REJECT: "var(--color-accent-yellow)",
  ANOMALY_ALERT: "var(--color-accent-pink)",
  HIBP_BLOCK: "var(--color-accent-blue)",
  RECOVERY_USED: "var(--color-muted)",
};

const tooltipStyle = {
  border: `2px solid ${INK}`,
  borderRadius: 8,
  background: "var(--color-surface-card)",
  color: "var(--color-text-primary)",
};

const axisProps = {
  stroke: MUTED,
  tick: { fill: MUTED, fontSize: 12 },
  tickLine: false,
} as const;

const margin = { top: 8, right: 12, bottom: 0, left: -16 };

export function LoginsByDayChart({
  data,
}: {
  data: AdminStats["loginsByDay"];
}) {
  const rows = data.map((day) => ({ ...day, label: formatDayLabel(day.date) }));
  return (
    <div
      role="img"
      aria-label="Biểu đồ số lượt đăng nhập theo ngày, 7 ngày gần nhất"
      className="h-64 w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={margin}>
          <CartesianGrid stroke={INK} strokeOpacity={0.15} vertical={false} />
          <XAxis dataKey="label" {...axisProps} />
          <YAxis allowDecimals={false} {...axisProps} />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value) => [value, "Lượt đăng nhập"]}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke={INK}
            strokeWidth={2}
            dot={{
              r: 4,
              fill: "var(--color-accent-lime)",
              stroke: INK,
              strokeWidth: 2,
            }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function EventsByTypeChart({
  data,
}: {
  data: AdminStats["securityEventsLast7Days"];
}) {
  const rows = SECURITY_EVENT_TYPES.map((type) => ({
    type,
    count: data[type] ?? 0,
  }));
  return (
    <div
      role="img"
      aria-label="Biểu đồ số sự kiện bảo mật theo loại, 7 ngày gần nhất"
      className="h-64 w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={margin}>
          <CartesianGrid stroke={INK} strokeOpacity={0.15} vertical={false} />
          <XAxis
            dataKey="type"
            {...axisProps}
            interval={0}
            tick={{ fill: MUTED, fontSize: 10 }}
          />
          <YAxis allowDecimals={false} {...axisProps} />
          <Tooltip
            contentStyle={tooltipStyle}
            labelFormatter={(type) => EVENT_LABELS[type as SecurityEventType]}
            formatter={(value) => [value, "Sự kiện"]}
          />
          <Bar
            dataKey="count"
            stroke={INK}
            strokeWidth={2}
            isAnimationActive={false}
          >
            {rows.map((row) => (
              <Cell key={row.type} fill={EVENT_COLORS[row.type]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
