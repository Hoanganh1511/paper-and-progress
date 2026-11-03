import axios from "axios";
import { authedApi } from "@/features/auth";
import type {
  StepArticle,
  StepInput,
  StudyListDetail,
  StudyListSummary,
} from "./types";

/** A failed study-lists call, carrying the message to show. */
export class StudyListsApiError extends Error {
  readonly status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.name = "StudyListsApiError";
    this.status = status;
  }
}

async function call<T>(request: Promise<{ data: T }>): Promise<T> {
  try {
    return (await request).data;
  } catch (error) {
    if (!axios.isAxiosError(error) || !error.response) {
      throw new StudyListsApiError("Không kết nối được máy chủ. Thử lại sau.");
    }
    const { status, data } = error.response;
    const raw = (data as { message?: unknown } | undefined)?.message;
    const message = Array.isArray(raw)
      ? raw.map(String).join(" ")
      : typeof raw === "string"
        ? raw
        : "Có lỗi xảy ra. Thử lại sau.";
    throw new StudyListsApiError(message, status);
  }
}

const base = "/study-lists";

export const listStudyLists = () =>
  call(authedApi.get<StudyListSummary[]>(base));

export const getStudyList = (id: string) =>
  call(authedApi.get<StudyListDetail>(`${base}/${id}`));

export const createStudyList = (input: {
  title: string;
  description?: string;
}) => call(authedApi.post<StudyListDetail>(base, input));

export const updateStudyList = (
  id: string,
  changes: { title?: string; description?: string },
) => call(authedApi.patch<StudyListDetail>(`${base}/${id}`, changes));

export const deleteStudyList = (id: string) =>
  call(authedApi.delete<{ deleted: true }>(`${base}/${id}`));

/* Parts and steps. Each call answers with the whole list, so the screen shows
 * what the server has. */

export const addSection = (
  id: string,
  input: { title: string; description?: string },
) => call(authedApi.post<StudyListDetail>(`${base}/${id}/sections`, input));

export const updateSection = (
  sectionId: string,
  changes: { title?: string; description?: string },
) =>
  call(
    authedApi.patch<StudyListDetail>(`${base}/sections/${sectionId}`, changes),
  );

export const deleteSection = (sectionId: string) =>
  call(authedApi.delete<StudyListDetail>(`${base}/sections/${sectionId}`));

export const reorderSections = (id: string, ids: string[]) =>
  call(authedApi.put<StudyListDetail>(`${base}/${id}/sections/order`, { ids }));

/** A step is an article (`articleId`, the title comes from it) or a note with its own `title`. */
export const addStep = (
  sectionId: string,
  input: { title?: string; articleId?: string; note?: string; url?: string },
) =>
  call(
    authedApi.post<StudyListDetail>(
      `${base}/sections/${sectionId}/steps`,
      input,
    ),
  );

/** Published articles and the learner's own drafts, found by title. */
export const searchStudyArticles = (q: string) =>
  call(
    authedApi.get<StepArticle[]>(`${base}/articles`, {
      params: q ? { q } : undefined,
    }),
  );

export const updateStep = (stepId: string, changes: StepInput) =>
  call(authedApi.patch<StudyListDetail>(`${base}/steps/${stepId}`, changes));

export const deleteStep = (stepId: string) =>
  call(authedApi.delete<StudyListDetail>(`${base}/steps/${stepId}`));

export const reorderSteps = (sectionId: string, ids: string[]) =>
  call(
    authedApi.put<StudyListDetail>(
      `${base}/sections/${sectionId}/steps/order`,
      { ids },
    ),
  );
