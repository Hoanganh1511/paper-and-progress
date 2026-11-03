"use client";

import { useState, type ReactNode } from "react";
import {
  Award,
  CalendarDays,
  CircleCheck,
  Clock,
  Layers,
  LayoutGrid,
  List,
  Plus,
  type LucideIcon,
} from "lucide-react";
import {
  Alert,
  Button,
  EmptyState,
  LayoutToggle,
  LinkButton,
  SearchInput,
  Skeleton,
  TabList,
  TabPanel,
  TabTrigger,
  Tabs,
  Text,
  cn,
} from "@/design-system";
import { useAdminQuery } from "@/features/admin/useAdminQuery";
import { listCertificates } from "../certificatesApi";
import { countByStatus, matchesSearch } from "../format";
import type { CertificateSummary } from "../types";
import { CertificateCard } from "./CertificateCard";
import { CertificateTable } from "./CertificateTable";

type Tab = "all" | "STUDYING" | "ACHIEVED" | "PLANNED";
type Layout = "grid" | "list";

const LAYOUTS = [
  { value: "grid", label: "Dạng thẻ", icon: LayoutGrid },
  { value: "list", label: "Danh sách", icon: List },
];

function StatCard({
  icon: Icon,
  value,
  label,
  tone,
}: {
  icon: LucideIcon;
  value: number;
  label: string;
  tone: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-standard border-2 border-border-strong bg-surface-card p-4 shadow-raised">
      <span
        aria-hidden="true"
        className={cn(
          "flex size-12 shrink-0 items-center justify-center rounded-pill border-2 border-border-strong text-ink",
          tone,
        )}
      >
        <Icon size={22} />
      </span>
      <div>
        <Text
          size="heading-lg"
          weight="bold"
          className="font-display leading-none"
        >
          {value}
        </Text>
        <Text size="body-sm" color="secondary">
          {label}
        </Text>
      </div>
    </div>
  );
}

function CardList({ items }: { items: readonly CertificateSummary[] }) {
  return (
    <ul className="grid gap-4 xl:grid-cols-2">
      {items.map((item) => (
        <li key={item.id} className="flex">
          <div className="w-full">
            <CertificateCard certificate={item} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** The certificates screen: counts, tabs by status, the list as cards or a table, and upcoming plans. */
export function CertificatesDashboard() {
  const query = useAdminQuery(listCertificates, "certificates");
  const [tab, setTab] = useState<Tab>("all");
  const [layout, setLayout] = useState<Layout>("grid");
  const [search, setSearch] = useState("");

  const all = query.data ?? [];
  const counts = countByStatus(all);
  const visible = all.filter((item) => matchesSearch(item, search));
  const inTab = (value: Tab) =>
    value === "all" ? visible : visible.filter((i) => i.status === value);

  const tabs: { value: Tab; label: string; count: number; icon: LucideIcon }[] =
    [
      { value: "all", label: "Tất cả", count: all.length, icon: Layers },
      {
        value: "STUDYING",
        label: "Đang học",
        count: counts.STUDYING,
        icon: Clock,
      },
      {
        value: "ACHIEVED",
        label: "Đã đạt",
        count: counts.ACHIEVED,
        icon: CircleCheck,
      },
      {
        value: "PLANNED",
        label: "Kế hoạch",
        count: counts.PLANNED,
        icon: CalendarDays,
      },
    ];

  function content(value: Tab): ReactNode {
    const items = inTab(value);
    // "Tất cả" keeps plans for their own section below the list.
    const main =
      value === "all" && layout === "grid"
        ? items.filter((item) => item.status !== "PLANNED")
        : items;
    const upcoming =
      value === "all" && layout === "grid"
        ? items
            .filter((item) => item.status === "PLANNED")
            .sort((a, b) =>
              (a.startDate ?? "").localeCompare(b.startDate ?? ""),
            )
        : [];

    if (items.length === 0) {
      return (
        <EmptyState
          icon={Award}
          title={
            search.trim()
              ? "Không có chứng chỉ nào khớp"
              : "Chưa có chứng chỉ nào"
          }
          description={
            search.trim()
              ? "Thử tìm bằng tên khác hoặc tổ chức cấp."
              : "Thêm chứng chỉ đầu tiên để bắt đầu theo dõi."
          }
          action={
            <LinkButton
              href="/certificates/new"
              variant="accent"
              leftIcon={Plus}
            >
              Thêm chứng chỉ
            </LinkButton>
          }
        />
      );
    }

    return (
      <>
        {main.length > 0 &&
          (layout === "grid" ? (
            <CardList items={main} />
          ) : (
            <CertificateTable certificates={main} />
          ))}
        {upcoming.length > 0 && (
          <section
            aria-labelledby="upcoming-title"
            className="flex flex-col gap-3"
          >
            <Text
              as="h3"
              id="upcoming-title"
              size="heading-sm"
              weight="bold"
              className="flex items-center gap-2 font-display"
            >
              <CalendarDays aria-hidden="true" size={20} />
              Kế hoạch sắp tới
            </Text>
            <CardList items={upcoming} />
          </section>
        )}
      </>
    );
  }

  let body: ReactNode;
  if (query.error && !query.data) {
    body = (
      <Alert variant="danger" title="Không tải được chứng chỉ">
        <div className="flex flex-wrap items-center gap-3">
          <span>{query.error.message}</span>
          <Button size="compact" variant="outline" onClick={query.reload}>
            Thử lại
          </Button>
        </div>
      </Alert>
    );
  } else if (!query.data) {
    body = (
      <div aria-busy="true" className="flex flex-col gap-4">
        <span role="status" className="sr-only">
          Đang tải
        </span>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  } else {
    body = (
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            icon={Award}
            value={all.length}
            label="Tổng chứng chỉ"
            tone="bg-accent-yellow"
          />
          <StatCard
            icon={CircleCheck}
            value={counts.ACHIEVED}
            label="Đã đạt"
            tone="bg-accent-lime"
          />
          <StatCard
            icon={Clock}
            value={counts.STUDYING}
            label="Đang học"
            tone="bg-accent-blue"
          />
          <StatCard
            icon={CalendarDays}
            value={counts.PLANNED}
            label="Kế hoạch"
            tone="bg-accent-pink"
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Text
            as="h2"
            size="heading-md"
            weight="bold"
            className="font-display"
          >
            Danh sách chứng chỉ
          </Text>
          <div className="flex flex-wrap items-center gap-3">
            <LayoutToggle
              label="Cách hiển thị"
              value={layout}
              onValueChange={(next) => setLayout(next as Layout)}
              options={LAYOUTS}
            />
            <LinkButton
              href="/certificates/new"
              variant="primary"
              leftIcon={Plus}
            >
              Thêm chứng chỉ
            </LinkButton>
          </div>
        </div>
        {tabs.map(({ value }) => (
          <TabPanel key={value} value={value} className="flex flex-col gap-6">
            {tab === value && content(value)}
          </TabPanel>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <SearchInput
        aria-label="Tìm chứng chỉ, tổ chức cấp"
        placeholder="Tìm chứng chỉ, tổ chức cấp…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        onClear={() => setSearch("")}
        className="sm:max-w-md"
      />
      <Tabs
        variant="folder"
        value={tab}
        onValueChange={(next) => setTab(next as Tab)}
        className="gap-0"
      >
        <TabList aria-label="Lọc chứng chỉ theo trạng thái">
          {tabs.map(({ value, label, count, icon: Icon }) => (
            <TabTrigger key={value} value={value}>
              <Icon aria-hidden="true" size={20} className="shrink-0" />
              {label} ({count})
            </TabTrigger>
          ))}
        </TabList>
        {/* overflow-hidden clips the lime band to the rounded border; the shadow is outside, so it stays. */}
        <div className="relative overflow-hidden rounded-tr-[1.5rem] rounded-b-[1.5rem] border-2 border-border-strong bg-surface-card shadow-[8px_8px_0_0_var(--color-border-strong)]">
          <div aria-hidden="true" className="h-2.5 bg-accent-lime" />
          <div className="p-5 sm:p-7 lg:p-8">{body}</div>
        </div>
      </Tabs>
    </div>
  );
}
