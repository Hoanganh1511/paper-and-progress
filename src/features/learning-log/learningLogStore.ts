"use client";

import { useSyncExternalStore } from "react";
import { SKILL_IDS, STATUS_IDS } from "./learningLogs";
import type { LearningLog } from "./types";

const STORAGE_KEY = "pp.learning-logs";
const EMPTY: LearningLog[] = [];

const listeners = new Set<() => void>();
// useSyncExternalStore needs the same array back until the data changes.
let cachedRaw: string | null | undefined;
let cachedLogs = EMPTY;

function isLog(value: unknown): value is LearningLog {
  const log = value as Partial<LearningLog> | null;
  return (
    typeof log?.id === "string" &&
    typeof log.title === "string" &&
    typeof log.learningDate === "string" &&
    typeof log.createdAt === "string" &&
    SKILL_IDS.includes(log.skillId as LearningLog["skillId"]) &&
    STATUS_IDS.includes(log.status as LearningLog["status"]) &&
    Array.isArray(log.tags) &&
    Array.isArray(log.referenceUrls)
  );
}

function read(): LearningLog[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return cachedLogs;
  }
  if (raw === cachedRaw) return cachedLogs;
  cachedRaw = raw;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    cachedLogs = Array.isArray(parsed) ? parsed.filter(isLog) : EMPTY;
  } catch {
    cachedLogs = EMPTY;
  }
  return cachedLogs;
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** Throws when the browser refuses to store the data, so a caller can keep the form. */
function write(logs: LearningLog[]) {
  const raw = JSON.stringify(logs);
  localStorage.setItem(STORAGE_KEY, raw);
  cachedRaw = raw;
  cachedLogs = logs;
  listeners.forEach((listener) => listener());
}

/** Learning logs kept in this browser's localStorage, not on a server. */
export function useLearningLogs(): LearningLog[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function appendLog(log: LearningLog) {
  write([...read(), log]);
}

export function removeLog(id: string) {
  write(read().filter((log) => log.id !== id));
}
