import axios from "axios";
import { authedApi } from "@/features/auth";
import type {
  CalendarDay,
  GateProgress,
  GateStats,
  LearnResponse,
  PracticeAnswerValue,
  PracticeResponse,
  PracticeResult,
  TestResponse,
  TestResult,
  TodayResponse,
} from "./types";

/** A failed Daily Gate call, carrying the message to show. */
export class DailyGateApiError extends Error {
  readonly status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.name = "DailyGateApiError";
    this.status = status;
  }
}

async function call<T>(request: Promise<{ data: T }>): Promise<T> {
  try {
    return (await request).data;
  } catch (error) {
    if (!axios.isAxiosError(error) || !error.response) {
      throw new DailyGateApiError("Không kết nối được máy chủ. Thử lại sau.");
    }
    const { status, data } = error.response;
    const raw = (data as { message?: unknown } | undefined)?.message;
    const message = Array.isArray(raw)
      ? raw.map(String).join(" ")
      : typeof raw === "string"
        ? raw
        : "Có lỗi xảy ra. Thử lại sau.";
    throw new DailyGateApiError(message, status);
  }
}

const base = "/daily-gate";

export const getToday = () =>
  call(authedApi.get<TodayResponse>(`${base}/today`));

export const getLearn = () =>
  call(authedApi.get<LearnResponse>(`${base}/learn`));

export const completeLearn = (lessonId: number) =>
  call(
    authedApi.post<{ progress: GateProgress }>(`${base}/learn/complete`, {
      lessonId,
    }),
  );

export const getPractice = () =>
  call(authedApi.get<PracticeResponse>(`${base}/practice`));

export const submitPractice = (
  lessonId: number,
  answers: { questionId: number; answer: PracticeAnswerValue }[],
) =>
  call(
    authedApi.post<PracticeResult>(`${base}/practice/submit`, {
      lessonId,
      answers,
    }),
  );

export const getTest = () => call(authedApi.get<TestResponse>(`${base}/test`));

export const submitTest = (
  lessonId: number,
  answers: { questionId: number; selectedIndex: number }[],
) =>
  call(
    authedApi.post<TestResult>(`${base}/test/submit`, { lessonId, answers }),
  );

export const getStats = () => call(authedApi.get<GateStats>(`${base}/stats`));

export const getCalendar = () =>
  call(authedApi.get<CalendarDay[]>(`${base}/calendar`));
