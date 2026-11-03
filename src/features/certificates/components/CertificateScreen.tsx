"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { listStudyLists } from "@/features/study-lists";
import { useAdminQuery } from "@/features/admin/useAdminQuery";
import { Alert, Button, Skeleton, useToast } from "@/design-system";
import { getCertificate, updateCertificate } from "../certificatesApi";
import type { CertificateDetail, CertificateInput } from "../types";
import { CertificateDetailView } from "./CertificateDetailView";
import { CertificateForm } from "./CertificateForm";

export interface CertificateScreenProps {
  id: string;
  /** Show the edit form instead of the detail. */
  isEditing?: boolean;
}

/** Loads one certificate and shows it, or the form to edit it. */
export function CertificateScreen({
  id,
  isEditing = false,
}: CertificateScreenProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [certificate, setCertificate] = useState<CertificateDetail>();
  const [error, setError] = useState<Error>();
  const [attempt, setAttempt] = useState(0);
  const lists = useAdminQuery(listStudyLists, "certificate-form-lists");

  useEffect(() => {
    let isCurrent = true;
    getCertificate(id)
      .then((result) => {
        if (isCurrent) {
          setCertificate(result);
          setError(undefined);
        }
      })
      .catch((caught: unknown) => {
        if (isCurrent) {
          setError(
            caught instanceof Error ? caught : new Error(String(caught)),
          );
        }
      });
    return () => {
      isCurrent = false;
    };
  }, [id, attempt]);

  if (error && !certificate) {
    return (
      <Alert variant="danger" title="Không tải được chứng chỉ">
        <div className="flex flex-wrap items-center gap-3">
          <span>{error.message}</span>
          <Button
            size="compact"
            variant="outline"
            onClick={() => setAttempt((n) => n + 1)}
          >
            Thử lại
          </Button>
          <Button
            size="compact"
            variant="ghost"
            onClick={() => router.push("/certificates")}
          >
            Về danh sách
          </Button>
        </div>
      </Alert>
    );
  }
  if (!certificate) {
    return (
      <div aria-busy="true" className="flex flex-col gap-4">
        <span role="status" className="sr-only">
          Đang tải
        </span>
        <Skeleton className="h-20 w-2/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isEditing) {
    async function handleSubmit(input: CertificateInput) {
      try {
        await updateCertificate(id, input);
        toast({ title: "Đã lưu thay đổi", variant: "success" });
        router.push(`/certificates/${id}`);
        return undefined;
      } catch (caught) {
        return caught instanceof Error ? caught.message : "Không lưu được.";
      }
    }
    return (
      <CertificateForm
        status={certificate.status}
        initial={certificate}
        studyLists={lists.data}
        canChangeStatus
        submitLabel="Lưu thay đổi"
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/certificates/${id}`)}
      />
    );
  }

  return (
    <CertificateDetailView
      certificate={certificate}
      onChange={setCertificate}
    />
  );
}
