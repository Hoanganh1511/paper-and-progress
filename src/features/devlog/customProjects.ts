"use client";

import { useSyncExternalStore } from "react";
import type { DevlogProject } from "./types";

const STORAGE_KEY = "pp.devlog.projects";
const EMPTY: DevlogProject[] = [];

const listeners = new Set<() => void>();
// useSyncExternalStore needs the same array back until the data changes.
let cachedRaw: string | null = null;
let cachedProjects = EMPTY;

function isProject(value: unknown): value is DevlogProject {
  const project = value as Partial<DevlogProject> | null;
  return (
    typeof project?.id === "string" &&
    typeof project.label === "string" &&
    (project.description === undefined ||
      typeof project.description === "string")
  );
}

function read(): DevlogProject[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return EMPTY;
  }
  if (raw === cachedRaw) return cachedProjects;
  cachedRaw = raw;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    cachedProjects = Array.isArray(parsed) ? parsed.filter(isProject) : EMPTY;
  } catch {
    cachedProjects = EMPTY;
  }
  return cachedProjects;
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

/**
 * Projects the user created in this browser. Entries come from files, so a
 * new project starts empty; it is kept in localStorage, not on a server.
 */
export function useCustomProjects(): DevlogProject[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function addCustomProject(project: DevlogProject) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...read(), project]));
  } catch {
    // Storage blocked: the project lasts only until the page is closed.
    cachedProjects = [...cachedProjects, project];
  }
  listeners.forEach((listener) => listener());
}
