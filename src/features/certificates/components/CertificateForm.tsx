"use client";

import { useState, type FormEvent } from "react";
import { Check } from "lucide-react";
import {
  Alert,
  Button,
  DatePicker,
  FormField,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  Textarea,
  datePickerLabelsVi,
} from "@/design-system";
import { STATUS_INFO, STATUS_ORDER } from "../format";
import type {
  CertificateInput,
  CertificateStatus,
  CertificateSummary,
} from "../types";
import type { StudyListSummary } from "@/features/study-lists";
import { CertificateThumb } from "./CertificateThumb";

export interface CertificateFormProps {
  status: CertificateStatus;
  /** The certificate being edited; without it the form is empty. */
  initial?: CertificateSummary & {
    verifyUrl?: string | null;
    notes?: string | null;
  };
  /** The learner's study lists, to link one; while it has steps, progress follows them. */
  studyLists?: readonly StudyListSummary[];
  /** Edit mode lets the learner move the certificate to another status. */
  canChangeStatus?: boolean;
  submitLabel: string;
  /** Resolves to an error message, or undefined once saved. */
  onSubmit: (input: CertificateInput) => Promise<string | undefined>;
  onCancel: () => void;
}

/** The Select's value for "no study list". */
const NO_LIST = "none";

type Errors = Partial<Record<keyof CertificateInput, string>>;

const isHttpUrl = (value: string) => /^https?:\/\/\S+$/i.test(value.trim());

/** One form for all three statuses: only the fields that fit the status are shown. */
export function CertificateForm({
  status: initialStatus,
  initial,
  studyLists = [],
  canChangeStatus = false,
  submitLabel,
  onSubmit,
  onCancel,
}: CertificateFormProps) {
  const [status, setStatus] = useState(initialStatus);
  const [name, setName] = useState(initial?.name ?? "");
  const [issuer, setIssuer] = useState(initial?.issuer ?? "");
  const [issuedAt, setIssuedAt] = useState(initial?.issuedAt ?? "");
  const [expiresAt, setExpiresAt] = useState(initial?.expiresAt ?? "");
  const [credentialId, setCredentialId] = useState(initial?.credentialId ?? "");
  const [score, setScore] = useState(initial?.score ?? "");
  const [verifyUrl, setVerifyUrl] = useState(initial?.verifyUrl ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [startDate, setStartDate] = useState(initial?.startDate ?? "");
  const [targetDate, setTargetDate] = useState(initial?.targetDate ?? "");
  const [progress, setProgress] = useState(initial?.progress ?? 0);
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [studyListId, setStudyListId] = useState(
    initial?.studyList?.id ?? NO_LIST,
  );
  // Progress follows the linked list's steps, so it is not typed while there are some.
  const linked = studyLists.find((list) => list.id === studyListId);
  const hasSteps = (linked?.stepCount ?? 0) > 0;
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState<string>();
  const [isSaving, setIsSaving] = useState(false);

  function validate(): Errors {
    const found: Errors = {};
    if (!name.trim()) found.name = "Nhập tên chứng chỉ.";
    if (!issuer.trim()) found.issuer = "Nhập tổ chức cấp.";
    if (status === "ACHIEVED") {
      if (!issuedAt) found.issuedAt = "Chọn ngày đạt.";
      else if (expiresAt && expiresAt < issuedAt)
        found.expiresAt = "Ngày hết hạn phải sau ngày đạt.";
      if (imageUrl.trim() && !isHttpUrl(imageUrl))
        found.imageUrl = "Link ảnh phải bắt đầu bằng http hoặc https.";
      if (verifyUrl.trim() && !isHttpUrl(verifyUrl))
        found.verifyUrl = "Link xác thực phải bắt đầu bằng http hoặc https.";
    } else if (!startDate) {
      found.startDate =
        status === "STUDYING" ? "Chọn ngày bắt đầu." : "Chọn ngày dự kiến.";
    } else if (targetDate && targetDate < startDate) {
      found.targetDate = "Ngày hoàn thành phải sau ngày bắt đầu.";
    }
    return found;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setIsSaving(true);
    setServerError(undefined);
    const input: CertificateInput = {
      name: name.trim(),
      issuer: issuer.trim(),
      status,
      notes: notes.trim(),
      studyListId: studyListId === NO_LIST ? "" : studyListId,
    };
    if (status === "ACHIEVED") {
      Object.assign(input, {
        issuedAt,
        expiresAt,
        credentialId: credentialId.trim(),
        score: score.trim(),
        verifyUrl: verifyUrl.trim(),
        imageUrl: imageUrl.trim(),
      });
    } else {
      Object.assign(input, { startDate, targetDate });
      if (status === "STUDYING" && !hasSteps) input.progress = progress;
    }
    const message = await onSubmit(input);
    if (message) setServerError(message);
    setIsSaving(false);
  }

  const validImage = isHttpUrl(imageUrl) ? imageUrl.trim() : null;

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {canChangeStatus && (
        <div
          role="group"
          aria-label="Trạng thái"
          className="flex flex-wrap gap-2"
        >
          {STATUS_ORDER.map((value) => (
            <Button
              key={value}
              type="button"
              size="compact"
              variant={status === value ? "accent" : "outline"}
              aria-pressed={status === value}
              leftIcon={status === value ? Check : STATUS_INFO[value].icon}
              onClick={() => setStatus(value)}
            >
              {STATUS_INFO[value].choice}
            </Button>
          ))}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <div className="flex flex-col gap-5">
          <FormField label="Tên chứng chỉ" required error={errors.name}>
            <Input
              value={name}
              maxLength={200}
              placeholder="VD: AWS Certified Solutions Architect – Associate"
              onChange={(event) => setName(event.target.value)}
            />
          </FormField>
          <FormField label="Tổ chức cấp" required error={errors.issuer}>
            <Input
              value={issuer}
              maxLength={200}
              placeholder="VD: Amazon Web Services"
              onChange={(event) => setIssuer(event.target.value)}
            />
          </FormField>

          {status === "ACHIEVED" && (
            <>
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField label="Ngày đạt" required error={errors.issuedAt}>
                  <DatePicker
                    value={issuedAt}
                    onValueChange={setIssuedAt}
                    labels={datePickerLabelsVi}
                  />
                </FormField>
                <FormField
                  label="Ngày hết hạn (nếu có)"
                  error={errors.expiresAt}
                >
                  <DatePicker
                    value={expiresAt}
                    min={issuedAt || undefined}
                    isClearable
                    onValueChange={setExpiresAt}
                    labels={datePickerLabelsVi}
                  />
                </FormField>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField label="Mã chứng chỉ (nếu có)">
                  <Input
                    value={credentialId}
                    maxLength={100}
                    onChange={(event) => setCredentialId(event.target.value)}
                  />
                </FormField>
                <FormField label="Điểm (nếu có)">
                  <Input
                    value={score}
                    maxLength={50}
                    placeholder="VD: 920/990"
                    onChange={(event) => setScore(event.target.value)}
                  />
                </FormField>
              </div>
              <FormField
                label="Link xác thực (nếu có)"
                error={errors.verifyUrl}
              >
                <Input
                  type="url"
                  inputMode="url"
                  value={verifyUrl}
                  placeholder="https://"
                  onChange={(event) => setVerifyUrl(event.target.value)}
                />
              </FormField>
            </>
          )}

          {status !== "ACHIEVED" && (
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                label={
                  status === "STUDYING" ? "Ngày bắt đầu" : "Dự kiến bắt đầu"
                }
                required
                error={errors.startDate}
              >
                <DatePicker
                  value={startDate}
                  onValueChange={setStartDate}
                  labels={datePickerLabelsVi}
                />
              </FormField>
              {status === "STUDYING" && (
                <FormField
                  label="Ngày dự kiến hoàn thành"
                  error={errors.targetDate}
                >
                  <DatePicker
                    value={targetDate}
                    min={startDate || undefined}
                    isClearable
                    onValueChange={setTargetDate}
                    labels={datePickerLabelsVi}
                  />
                </FormField>
              )}
            </div>
          )}

          <FormField
            label="Danh sách học"
            description={
              studyLists.length === 0
                ? "Bạn chưa có danh sách học nào. Tạo ở Thư viện kiến thức, tab “Danh sách học”."
                : "Gắn một danh sách học để theo dõi tiến độ chứng chỉ này."
            }
          >
            <Select
              value={studyListId}
              onValueChange={setStudyListId}
              disabled={studyLists.length === 0 && studyListId === NO_LIST}
            >
              <SelectTrigger placeholder="Không liên kết" />
              <SelectContent>
                <SelectItem value={NO_LIST}>Không liên kết</SelectItem>
                {studyLists.map((list) => (
                  <SelectItem key={list.id} value={list.id}>
                    {list.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          {status === "STUDYING" && (
            <FormField
              label="Tiến độ hiện tại"
              description={
                hasSteps
                  ? "Tính từ các bước đã xong trong danh sách học đã liên kết."
                  : "Kéo để chỉnh. Khi danh sách học đã liên kết có bước, tiến độ sẽ tự tính."
              }
            >
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={progress}
                  disabled={hasSteps}
                  aria-label="Tiến độ hiện tại"
                  className="min-h-11 flex-1 accent-ink"
                  onChange={(event) => setProgress(Number(event.target.value))}
                />
                <output className="w-12 text-right font-semibold">
                  {progress}%
                </output>
              </div>
            </FormField>
          )}
        </div>

        <div className="flex flex-col gap-5">
          {status === "ACHIEVED" && (
            <FormField
              label="Ảnh chứng chỉ"
              description="Dán link ảnh khi bạn đã tải lên nơi lưu trữ."
              error={errors.imageUrl}
            >
              <div className="flex flex-col gap-3">
                <Input
                  type="url"
                  inputMode="url"
                  value={imageUrl}
                  placeholder="https://"
                  onChange={(event) => setImageUrl(event.target.value)}
                />
                <CertificateThumb
                  imageUrl={validImage}
                  name={name || "chứng chỉ"}
                  status={status}
                  className="aspect-[4/3] w-full rounded-standard border-2 border-border-strong"
                />
              </div>
            </FormField>
          )}
          <FormField
            label={status === "PLANNED" ? "Ghi chú (tùy chọn)" : "Ghi chú"}
          >
            <Textarea
              rows={status === "ACHIEVED" ? 3 : 5}
              maxLength={5000}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </FormField>
        </div>
      </div>

      {serverError && <Alert variant="danger">{serverError}</Alert>}

      <div className="flex flex-wrap justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Hủy
        </Button>
        <Button type="submit" variant="accent" isLoading={isSaving}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
