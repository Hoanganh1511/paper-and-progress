import axios from "axios";
import { authedApi } from "@/features/auth";
import type {
  CertificateDetail,
  CertificateInput,
  CertificateSummary,
} from "./types";

/** A failed certificates call, carrying the message to show. */
export class CertificatesApiError extends Error {
  readonly status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.name = "CertificatesApiError";
    this.status = status;
  }
}

async function call<T>(request: Promise<{ data: T }>): Promise<T> {
  try {
    return (await request).data;
  } catch (error) {
    if (!axios.isAxiosError(error) || !error.response) {
      throw new CertificatesApiError(
        "Không kết nối được máy chủ. Thử lại sau.",
      );
    }
    const { status, data } = error.response;
    const raw = (data as { message?: unknown } | undefined)?.message;
    const message = Array.isArray(raw)
      ? raw.map(String).join(" ")
      : typeof raw === "string"
        ? raw
        : "Có lỗi xảy ra. Thử lại sau.";
    throw new CertificatesApiError(message, status);
  }
}

const base = "/certificates";

export const listCertificates = () =>
  call(authedApi.get<CertificateSummary[]>(base));

export const getCertificate = (id: string) =>
  call(authedApi.get<CertificateDetail>(`${base}/${id}`));

export const createCertificate = (input: CertificateInput) =>
  call(authedApi.post<CertificateDetail>(base, input));

export const updateCertificate = (
  id: string,
  changes: Partial<CertificateInput>,
) => call(authedApi.patch<CertificateDetail>(`${base}/${id}`, changes));

export const deleteCertificate = (id: string) =>
  call(authedApi.delete<{ deleted: true }>(`${base}/${id}`));

export const addResource = (
  id: string,
  input: { title: string; url: string },
) => call(authedApi.post<CertificateDetail>(`${base}/${id}/resources`, input));

export const deleteResource = (resourceId: string) =>
  call(authedApi.delete<CertificateDetail>(`${base}/resources/${resourceId}`));
