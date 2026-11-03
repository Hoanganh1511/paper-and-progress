"use client";

import { useState } from "react";
import { listStudyLists } from "@/features/study-lists";
import { useAdminQuery } from "@/features/admin/useAdminQuery";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Award } from "lucide-react";
import { Button, Text, cn, useToast } from "@/design-system";
import { createCertificate } from "../certificatesApi";
import { STATUS_INFO, STATUS_ORDER } from "../format";
import type { CertificateInput, CertificateStatus } from "../types";
import { CertificateForm } from "./CertificateForm";

/** Step 1 picks what kind of certificate; step 2 is the form that kind needs. */
export function AddCertificateFlow() {
  const router = useRouter();
  const { toast } = useToast();
  const [choice, setChoice] = useState<CertificateStatus>("ACHIEVED");
  const [status, setStatus] = useState<CertificateStatus>();
  // If this fails the form still works, just without a list to link.
  const lists = useAdminQuery(listStudyLists, "certificate-form-lists");

  async function handleSubmit(input: CertificateInput) {
    try {
      const created = await createCertificate(input);
      toast({ title: "Đã thêm chứng chỉ", variant: "success" });
      router.push(`/certificates/${created.id}`);
      return undefined;
    } catch (error) {
      return error instanceof Error ? error.message : "Không lưu được.";
    }
  }

  if (status) {
    return (
      <div className="flex flex-col gap-5">
        <Button
          variant="ghost"
          leftIcon={ArrowLeft}
          className="self-start"
          onClick={() => setStatus(undefined)}
        >
          Chọn loại khác
        </Button>
        <Text as="h2" size="heading-md" weight="bold" className="font-display">
          Thêm chứng chỉ · {STATUS_INFO[status].choice}
        </Text>
        <CertificateForm
          status={status}
          studyLists={lists.data}
          submitLabel="Thêm chứng chỉ"
          onSubmit={handleSubmit}
          onCancel={() => router.push("/certificates")}
        />
      </div>
    );
  }

  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex size-12 items-center justify-center rounded-standard border-2 border-border-strong bg-accent-lime text-ink"
        >
          <Award size={24} />
        </span>
        <div>
          <Text
            as="h2"
            size="heading-md"
            weight="bold"
            className="font-display"
          >
            Thêm chứng chỉ
          </Text>
          <Text size="body-sm" color="secondary">
            Chọn loại chứng chỉ bạn muốn thêm.
          </Text>
        </div>
      </div>

      <div
        role="group"
        aria-label="Loại chứng chỉ"
        className="flex flex-col gap-3"
      >
        {STATUS_ORDER.map((value) => {
          const info = STATUS_INFO[value];
          const isSelected = choice === value;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={isSelected}
              onClick={() => setChoice(value)}
              className={cn(
                "flex min-h-16 cursor-pointer items-center gap-4 rounded-standard border-2 border-border-strong p-4 text-left shadow-raised motion-reduce:transition-none",
                "active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
                isSelected ? "bg-accent-lime text-ink" : "bg-surface-card",
              )}
            >
              <info.icon aria-hidden="true" size={24} className="shrink-0" />
              <span className="flex flex-col">
                <span className="font-display text-heading-sm font-bold">
                  {info.choice}
                </span>
                <span className="text-body-sm">{info.hint}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        <Button variant="outline" onClick={() => router.push("/certificates")}>
          Hủy
        </Button>
        <Button
          variant="accent"
          rightIcon={ArrowRight}
          onClick={() => setStatus(choice)}
        >
          Tiếp tục
        </Button>
      </div>
    </div>
  );
}
