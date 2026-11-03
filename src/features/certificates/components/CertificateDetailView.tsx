"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  CalendarDays,
  ExternalLink,
  Maximize2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import {
  Alert,
  AlertDialog,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  EmptyState,
  FormField,
  Image,
  Input,
  LinkButton,
  ProgressBar,
  TabList,
  TabPanel,
  TabTrigger,
  Tabs,
  Text,
  Textarea,
  useToast,
} from "@/design-system";
import {
  addResource,
  deleteCertificate,
  deleteResource,
  updateCertificate,
} from "../certificatesApi";
import { STATUS_INFO, formatDate } from "../format";
import type { CertificateDetail } from "../types";
import { CertificateThumb } from "./CertificateThumb";

type Tab = "overview" | "resources" | "notes";

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border-subtle py-2">
      <dt className="text-body-sm text-text-secondary">{label}</dt>
      <dd className="text-right font-semibold">{children}</dd>
    </div>
  );
}

function Overview({
  certificate,
  onPreview,
}: {
  certificate: CertificateDetail;
  onPreview: () => void;
}) {
  const { status } = certificate;
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="flex flex-col gap-5">
        {status === "STUDYING" && (
          <ProgressBar value={certificate.progress} label="Tiến độ" showValue />
        )}
        <dl>
          <Fact label="Trạng thái">
            <Badge
              variant={STATUS_INFO[status].variant}
              icon={STATUS_INFO[status].icon}
            >
              {STATUS_INFO[status].badge}
            </Badge>
          </Fact>
          {status === "ACHIEVED" ? (
            <>
              <Fact label="Ngày đạt">{formatDate(certificate.issuedAt)}</Fact>
              <Fact label="Hết hạn">{formatDate(certificate.expiresAt)}</Fact>
              {certificate.score && (
                <Fact label="Điểm">{certificate.score}</Fact>
              )}
              <Fact label="Mã chứng chỉ">
                {certificate.credentialId ?? "—"}
              </Fact>
              <Fact label="Liên kết xác thực">
                {certificate.verifyUrl ? (
                  <a
                    href={certificate.verifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 break-all underline underline-offset-4"
                  >
                    Mở trang xác thực
                    <ExternalLink aria-hidden="true" size={14} />
                  </a>
                ) : (
                  "—"
                )}
              </Fact>
            </>
          ) : (
            <>
              <Fact
                label={
                  status === "STUDYING" ? "Ngày bắt đầu" : "Dự kiến bắt đầu"
                }
              >
                {formatDate(certificate.startDate)}
              </Fact>
              {status === "STUDYING" && (
                <Fact label="Dự kiến hoàn thành">
                  {formatDate(certificate.targetDate)}
                </Fact>
              )}
            </>
          )}
          <Fact label="Danh sách học">
            {certificate.studyList ? (
              <Link
                href={`/study-lists/${certificate.studyList.id}`}
                className="inline-flex items-center gap-1 underline underline-offset-4"
              >
                {certificate.studyList.title}
                {certificate.studyList.stepCount > 0 &&
                  ` (${certificate.studyList.doneStepCount}/${certificate.studyList.stepCount} bước)`}
                <ArrowUpRight aria-hidden="true" size={14} />
              </Link>
            ) : (
              "Chưa liên kết"
            )}
          </Fact>
        </dl>
      </div>

      <div className="flex flex-col gap-2">
        <Text as="h3" size="heading-sm" weight="bold" className="font-display">
          Chứng chỉ
        </Text>
        {certificate.imageUrl ? (
          <button
            type="button"
            onClick={onPreview}
            aria-label="Xem ảnh chứng chỉ lớn hơn"
            className="group relative cursor-pointer rounded-standard border-2 border-border-strong bg-surface-card p-2 shadow-raised"
          >
            <CertificateThumb
              imageUrl={certificate.imageUrl}
              name={certificate.name}
              status={status}
              className="aspect-[4/3] w-full"
            />
            <Maximize2
              aria-hidden="true"
              size={18}
              className="absolute top-3 right-3"
            />
          </button>
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-standard border-2 border-dashed border-border-strong p-6 text-center">
            <CertificateThumb
              imageUrl={null}
              name={certificate.name}
              status={status}
              className="size-20 rounded-pill"
            />
            <Text size="body-sm" color="secondary">
              Chưa có ảnh. Thêm link ảnh khi bạn có chứng chỉ.
            </Text>
          </div>
        )}
      </div>
    </div>
  );
}

function Resources({
  certificate,
  onChange,
}: {
  certificate: CertificateDetail;
  onChange: (certificate: CertificateDetail) => void;
}) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string>();
  const [isBusy, setIsBusy] = useState(false);

  async function run(request: Promise<CertificateDetail>) {
    setIsBusy(true);
    setError(undefined);
    try {
      onChange(await request);
      return true;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không lưu được.");
      return false;
    } finally {
      setIsBusy(false);
    }
  }

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !url.trim()) return;
    if (
      await run(
        addResource(certificate.id, { title: title.trim(), url: url.trim() }),
      )
    ) {
      setTitle("");
      setUrl("");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <Alert variant="danger">{error}</Alert>}
      {certificate.resources.length === 0 ? (
        <EmptyState
          title="Chưa có tài liệu"
          description="Lưu khoá học, đề thi thử hay trang tài liệu bạn dùng để học."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {certificate.resources.map((resource) => (
            <li
              key={resource.id}
              className="flex items-center justify-between gap-3 rounded-standard border-2 border-border-strong bg-surface-card p-3"
            >
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-w-0 items-center gap-2 font-semibold underline-offset-4 hover:underline"
              >
                <span className="truncate">{resource.title}</span>
                <ExternalLink
                  aria-hidden="true"
                  size={14}
                  className="shrink-0"
                />
              </a>
              <Button
                size="compact"
                variant="ghost"
                leftIcon={Trash2}
                aria-label={`Xoá tài liệu “${resource.title}”`}
                disabled={isBusy}
                onClick={() => void run(deleteResource(resource.id))}
              />
            </li>
          ))}
        </ul>
      )}
      <form
        onSubmit={handleAdd}
        noValidate
        className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
      >
        <FormField label="Tên tài liệu">
          <Input
            value={title}
            maxLength={200}
            onChange={(e) => setTitle(e.target.value)}
          />
        </FormField>
        <FormField label="Link">
          <Input
            type="url"
            inputMode="url"
            value={url}
            placeholder="https://"
            onChange={(e) => setUrl(e.target.value)}
          />
        </FormField>
        <Button
          type="submit"
          variant="accent"
          leftIcon={Plus}
          disabled={!title.trim() || !url.trim() || isBusy}
        >
          Thêm
        </Button>
      </form>
    </div>
  );
}

function Notes({
  certificate,
  onChange,
}: {
  certificate: CertificateDetail;
  onChange: (certificate: CertificateDetail) => void;
}) {
  const { toast } = useToast();
  const [value, setValue] = useState(certificate.notes ?? "");
  const [error, setError] = useState<string>();
  const [isSaving, setIsSaving] = useState(false);

  async function save() {
    setIsSaving(true);
    setError(undefined);
    try {
      onChange(
        await updateCertificate(certificate.id, { notes: value.trim() }),
      );
      toast({ title: "Đã lưu ghi chú", variant: "success" });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không lưu được.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <FormField label="Ghi chú">
        <Textarea
          rows={8}
          maxLength={5000}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </FormField>
      {error && <Alert variant="danger">{error}</Alert>}
      <div className="flex justify-end">
        <Button
          variant="accent"
          isLoading={isSaving}
          disabled={value.trim() === (certificate.notes ?? "")}
          onClick={save}
        >
          Lưu ghi chú
        </Button>
      </div>
    </div>
  );
}

export interface CertificateDetailViewProps {
  certificate: CertificateDetail;
  onChange: (certificate: CertificateDetail) => void;
}

/** One certificate: its facts, a link to its study list, resources and notes. */
export function CertificateDetailView({
  certificate,
  onChange,
}: CertificateDetailViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("overview");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string>();
  const info = STATUS_INFO[certificate.status];

  async function confirmDelete() {
    setIsDeleting(true);
    setDeleteError(undefined);
    try {
      await deleteCertificate(certificate.id);
      toast({ title: "Đã xoá chứng chỉ", variant: "success" });
      router.push("/certificates");
    } catch (caught) {
      setDeleteError(
        caught instanceof Error ? caught.message : "Không xoá được.",
      );
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <CertificateThumb
            imageUrl={certificate.imageUrl}
            name={certificate.name}
            status={certificate.status}
            className="size-20 shrink-0 rounded-standard border-2 border-border-strong"
          />
          <div className="min-w-0">
            <Text
              as="h2"
              size="heading-lg"
              weight="bold"
              className="font-display"
            >
              {certificate.name}
            </Text>
            <Text color="secondary">{certificate.issuer}</Text>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={info.variant} icon={info.icon}>
            {info.badge}
          </Badge>
          <LinkButton
            href={`/certificates/${certificate.id}/edit`}
            variant="outline"
            leftIcon={Pencil}
          >
            Sửa
          </LinkButton>
          <Button
            variant="outline"
            leftIcon={Trash2}
            onClick={() => setIsDeleteOpen(true)}
          >
            Xoá
          </Button>
        </div>
      </header>

      <Tabs value={tab} onValueChange={(next) => setTab(next as Tab)}>
        <TabList aria-label="Chi tiết chứng chỉ">
          <TabTrigger value="overview">Tổng quan</TabTrigger>
          <TabTrigger value="resources">
            Tài liệu ({certificate.resources.length})
          </TabTrigger>
          <TabTrigger value="notes">Ghi chú</TabTrigger>
        </TabList>
        <TabPanel value="overview">
          {tab === "overview" && (
            <Overview
              certificate={certificate}
              onPreview={() => setIsPreviewOpen(true)}
            />
          )}
        </TabPanel>
        <TabPanel value="resources">
          {tab === "resources" && (
            <Resources certificate={certificate} onChange={onChange} />
          )}
        </TabPanel>
        <TabPanel value="notes">
          {tab === "notes" && (
            <Notes certificate={certificate} onChange={onChange} />
          )}
        </TabPanel>
      </Tabs>

      {certificate.status === "PLANNED" && (
        <Text
          size="body-sm"
          color="secondary"
          className="flex items-center gap-1.5"
        >
          <CalendarDays aria-hidden="true" size={14} />
          Khi bắt đầu học, bấm{" "}
          <Link
            href={`/certificates/${certificate.id}/edit`}
            className="font-semibold underline underline-offset-4"
          >
            Sửa
          </Link>{" "}
          và chuyển sang “Đang học”.
        </Text>
      )}

      <Dialog
        open={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        size="lg"
      >
        <DialogHeader title="Xem chứng chỉ" closeLabel="Đóng" />
        <DialogContent>
          {certificate.imageUrl && (
            <Image
              src={certificate.imageUrl}
              alt={`Ảnh chứng chỉ ${certificate.name}`}
              fit="contain"
              className="max-h-[70dvh] w-full bg-surface-card"
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isDeleteOpen}
        variant="destructive"
        title="Xoá chứng chỉ?"
        description={`Bạn có chắc muốn xoá chứng chỉ “${certificate.name}” không? Tài liệu và ghi chú của nó cũng bị xoá (danh sách học liên kết vẫn được giữ). Hành động này không thể hoàn tác.`}
        confirmLabel="Xoá"
        cancelLabel="Hủy"
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteOpen(false)}
      >
        {deleteError && <Alert variant="danger">{deleteError}</Alert>}
      </AlertDialog>
    </div>
  );
}
