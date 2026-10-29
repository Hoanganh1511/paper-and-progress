"use client";

import { useSyncExternalStore } from "react";
import { SEED_LOGS } from "./data";
import { SKILLS } from "./logs";
import type { DiaryLog } from "./types";

const STORAGE_KEY = "pp.english-diary.logs";

const listeners = new Set<() => void>();
// useSyncExternalStore needs the same array back until the data changes.
let cachedRaw: string | null | undefined;
let cachedLogs = SEED_LOGS;

function isLog(value: unknown): value is DiaryLog {
  const log = value as Partial<DiaryLog> | null;
  return (
    typeof log?.id === "string" &&
    typeof log.title === "string" &&
    typeof log.date === "string" &&
    typeof log.createdAt === "string" &&
    SKILLS.includes(log.skill as DiaryLog["skill"]) &&
    (log.status === "draft" || log.status === "completed") &&
    Array.isArray(log.vocabulary) &&
    Array.isArray(log.resources) &&
    Array.isArray(log.tags)
  );
}

function read(): DiaryLog[] {
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
    cachedLogs = Array.isArray(parsed) ? parsed.filter(isLog) : SEED_LOGS;
  } catch {
    cachedLogs = SEED_LOGS;
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

function write(logs: DiaryLog[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    cachedRaw = localStorage.getItem(STORAGE_KEY);
  } catch {
    // Storage blocked: changes last only until the page is closed.
  }
  cachedLogs = logs;
  listeners.forEach((listener) => listener());
}

/** Diary logs kept in this browser's localStorage, not on a server. */
export function useDiaryLogs(): DiaryLog[] {
  return useSyncExternalStore(subscribe, read, () => SEED_LOGS);
}

export function saveLog(log: DiaryLog) {
  const logs = read();
  const exists = logs.some((item) => item.id === log.id);
  write(
    exists
      ? logs.map((item) => (item.id === log.id ? log : item))
      : [...logs, log],
  );
}

export function deleteLog(id: string) {
  write(read().filter((log) => log.id !== id));
}
