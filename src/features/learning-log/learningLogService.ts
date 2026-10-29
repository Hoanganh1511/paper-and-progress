import { appendLog, removeLog } from "./learningLogStore";
import type { LearningLog, LearningLogDraft } from "./types";

/** A save or delete that could not be completed; the message is safe to show. */
export class LearningLogError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LearningLogError";
  }
}

// The one place that knows where logs live. There is no learning-log API yet, so
// these write to the browser; when the backend has one, only this file changes.

export async function createLearningLog(
  draft: LearningLogDraft,
): Promise<LearningLog> {
  const now = new Date().toISOString();
  const log: LearningLog = {
    ...draft,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
  try {
    appendLog(log);
  } catch {
    throw new LearningLogError(
      "Không lưu được log trên trình duyệt này. Dữ liệu bạn nhập vẫn còn, hãy thử lại.",
    );
  }
  return log;
}

export async function deleteLearningLog(id: string): Promise<void> {
  try {
    removeLog(id);
  } catch {
    throw new LearningLogError("Không xoá được log. Thử lại sau.");
  }
}
