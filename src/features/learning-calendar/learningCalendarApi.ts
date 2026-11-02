import axios from "axios";
import { authedApi } from "@/features/auth";
import type { CalendarResponse, DayResponse, MonthRef } from "./types";

export class LearningCalendarApiError extends Error {
  status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.name = "LearningCalendarApiError";
    this.status = status;
  }
}

async function call<T>(request: Promise<{ data: T }>): Promise<T> {
  try {
    return (await request).data;
  } catch (error) {
    if (!axios.isAxiosError(error) || !error.response) {
      throw new LearningCalendarApiError(
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
    throw new LearningCalendarApiError(message, status);
  }
}

/** One month for the grid and the overview. Without a month, the server's current one. */
export const getCalendar = (month?: MonthRef) =>
  call(
    authedApi.get<CalendarResponse>("/learning-activity/calendar", {
      params: month,
    }),
  );

export const getDayActivity = (date: string) =>
  call(authedApi.get<DayResponse>(`/learning-activity/days/${date}`));
