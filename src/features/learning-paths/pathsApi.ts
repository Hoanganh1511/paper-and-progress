import axios from "axios";
import { authedApi } from "@/features/auth";
import type {
  PathDetail,
  PathSummary,
  StepDetail,
  StepProgressInput,
  StepProgressResult,
} from "./types";

export class PathsApiError extends Error {
  status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.name = "PathsApiError";
    this.status = status;
  }
}

async function call<T>(request: Promise<{ data: T }>): Promise<T> {
  try {
    return (await request).data;
  } catch (error) {
    if (!axios.isAxiosError(error) || !error.response) {
      throw new PathsApiError("Không kết nối được máy chủ. Thử lại sau.");
    }
    const { status, data } = error.response;
    const raw = (data as { message?: unknown } | undefined)?.message;
    const message = Array.isArray(raw)
      ? raw.map(String).join(" ")
      : typeof raw === "string"
        ? raw
        : "Có lỗi xảy ra. Thử lại sau.";
    throw new PathsApiError(message, status);
  }
}

/** Calls made in the browser with the signed-in learner's token. */
export const getPath = (slug: string) =>
  call(authedApi.get<PathDetail>(`/paths/${encodeURIComponent(slug)}`));

export const getStep = (slug: string, stepSlug: string) =>
  call(
    authedApi.get<StepDetail>(
      `/paths/${encodeURIComponent(slug)}/steps/${encodeURIComponent(stepSlug)}`,
    ),
  );

export const startPath = (slug: string) =>
  call(
    authedApi.post<PathDetail["progress"]>(
      `/paths/${encodeURIComponent(slug)}/start`,
    ),
  );

export const saveStepProgress = (
  slug: string,
  stepSlug: string,
  input: StepProgressInput,
) =>
  call(
    authedApi.put<StepProgressResult>(
      `/paths/${encodeURIComponent(slug)}/steps/${encodeURIComponent(stepSlug)}/progress`,
      input,
    ),
  );

export const listMyPaths = () =>
  call(authedApi.get<PathSummary[]>("/paths/mine"));
