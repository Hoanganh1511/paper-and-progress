import { useId, type ComponentProps } from "react";
import { ArrowLeft, CalendarDays, Check, Layers, Loader } from "lucide-react";
import {
  Badge,
  Breadcrumbs,
  Button,
  Card,
  Image,
  ProgressBar,
  Text,
  cn,
  focusRingClasses,
} from "@/design-system";
import { STATUS_LABELS, formatDevlogDate, getModuleLabel } from "../../status";
import type { DevlogEntry } from "../../types";
import { DevlogBlocks } from "../DevlogBlocks";

export interface DevlogDetailPanelProps extends Omit<
  ComponentProps<"article">,
  "ref" | "title"
> {
  entry: DevlogEntry;
  /** Narrows the timeline to the entry's module (the breadcrumb's module step). */
  onFilterModule: (moduleId: string) => void;
  /** Shows a back button (small screens, where list and detail are separate views). */
  onBack?: () => void;
}

function Metadata({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof CalendarDays;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-standard border-2 border-border-strong bg-surface-card p-3">
      <dt className="inline-flex items-center gap-1 font-body text-caption text-text-muted">
        <Icon aria-hidden="true" size={14} />
        {label}
      </dt>
      <dd className="m-0 font-body text-body-md font-medium text-text-primary">
        {children}
      </dd>
    </div>
  );
}

/**
 * The selected entry in full, next to the timeline: where it belongs
 * (breadcrumb), its title, status, tags and progress, the key facts, then the
 * text and picture. Selecting another entry only swaps this panel.
 */
export function DevlogDetailPanel({
  entry,
  onFilterModule,
  onBack,
  className,
  ...props
}: DevlogDetailPanelProps) {
  const titleId = useId();
  const moduleLabel = getModuleLabel(entry.module);
  const isDone = entry.status === "done";

  return (
    <Card
      as="article"
      aria-labelledby={titleId}
      padding="default"
      className={cn("flex flex-col gap-4", className)}
      {...props}
    >
      {onBack && (
        <Button
          variant="ghost"
          size="compact"
          leftIcon={ArrowLeft}
          onClick={onBack}
          className="self-start lg:hidden"
        >
          Quay lại danh sách
        </Button>
      )}

      <Breadcrumbs
        label="Vị trí của entry"
        items={[
          { label: "Dự án" },
          { label: "Paper & Progress" },
          {
            label: (
              <button
                type="button"
                onClick={() => onFilterModule(entry.module)}
                className={cn(
                  "rounded-standard underline-offset-2 hover:underline",
                  focusRingClasses,
                )}
              >
                {moduleLabel}
              </button>
            ),
          },
          { label: entry.title },
        ]}
      />

      <header className="flex flex-col gap-3">
        <Badge
          size="sm"
          variant={isDone ? "success" : "yellow"}
          icon={isDone ? Check : Loader}
          className="self-start"
        >
          {STATUS_LABELS[entry.status]}
        </Badge>
        <Text as="h2" id={titleId} size="heading-md" weight="semibold">
          {entry.title}
        </Text>
        {entry.tags.length > 0 && (
          <ul
            aria-label="Công nghệ và thẻ"
            className="m-0 flex list-none flex-wrap gap-1 p-0"
          >
            {entry.tags.map((tag) => (
              <li key={tag}>
                <Badge size="sm">#{tag}</Badge>
              </li>
            ))}
          </ul>
        )}
        <ProgressBar
          value={entry.progress}
          label={`Tiến độ ${moduleLabel} sau cập nhật này`}
          showValue
        />
      </header>

      <dl className="m-0 grid gap-3 sm:grid-cols-2">
        <Metadata icon={CalendarDays} label="Ngày ghi nhận">
          <time dateTime={entry.date}>{formatDevlogDate(entry.date)}</time>
        </Metadata>
        <Metadata icon={Layers} label="Module">
          {moduleLabel}
          {entry.phase && ` · Phase ${entry.phase}`}
        </Metadata>
      </dl>

      <section aria-label="Nội dung" className="flex flex-col gap-3">
        <DevlogBlocks blocks={entry.body} />
        {entry.image && (
          <Image
            src={entry.image}
            alt={entry.imageAlt ?? ""}
            aspectRatio="video"
            className="w-full"
          />
        )}
      </section>
    </Card>
  );
}
