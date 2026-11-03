import axios from "axios";
import { authedApi } from "@/features/auth";
import type {
  CefrLevel,
  Paged,
  VocabMeta,
  WordDetailFull,
  WordPayload,
  WordSummary,
} from "./types";

/** A failed vocabulary call, carrying the message to show. */
export class VocabularyApiError extends Error {
  readonly status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.name = "VocabularyApiError";
    this.status = status;
  }
}

async function call<T>(request: Promise<{ data: T }>): Promise<T> {
  try {
    return (await request).data;
  } catch (error) {
    if (!axios.isAxiosError(error) || !error.response) {
      throw new VocabularyApiError("Không kết nối được máy chủ. Thử lại sau.");
    }
    const { status, data } = error.response;
    const raw = (data as { message?: unknown } | undefined)?.message;
    const message = Array.isArray(raw)
      ? raw.map(String).join(" ")
      : typeof raw === "string"
        ? raw
        : "Có lỗi xảy ra. Thử lại sau.";
    throw new VocabularyApiError(message, status);
  }
}

const base = "/admin/vocabulary";

export interface VocabularyQuery {
  q?: string;
  unitId?: number;
  level?: CefrLevel;
  page: number;
  limit: number;
}

export const getVocabularyMeta = () =>
  call(authedApi.get<VocabMeta>(`${base}/meta`));

export const listVocabulary = (query: VocabularyQuery) =>
  call(authedApi.get<Paged<WordSummary>>(base, { params: query }));

export const getVocabularyWord = (id: number) =>
  call(authedApi.get<WordDetailFull>(`${base}/${id}`));

export const createVocabularyWord = (payload: WordPayload) =>
  call(authedApi.post<WordDetailFull>(base, payload));

export const updateVocabularyWord = (id: number, payload: WordPayload) =>
  call(authedApi.patch<WordDetailFull>(`${base}/${id}`, payload));

export const deleteVocabularyWord = (id: number) =>
  call(authedApi.delete<{ deleted: true }>(`${base}/${id}`));
