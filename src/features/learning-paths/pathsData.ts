import { cacheLife, cacheTag } from "next/cache";
import type { PathDetail, PathSummary, StepDetail } from "./types";

/**
 * Reads for the public pages, on the server. A guest sees the same text a
 * signed-in learner does; what is theirs (progress, notes) is fetched in the
 * browser by `pathsApi`, never through these caches.
 */
const API_BASE = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/v1`;

export const PATHS_TAG = "paths";

async function getJson<T>(path: string): Promise<{ status: number; body: T }> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { accept: "application/json" },
  });
  const body = (await response.json().catch(() => ({}))) as T;
  return { status: response.status, body };
}

export async function fetchPaths(query: {
  q?: string;
  topic?: string;
  level?: string;
}): Promise<PathSummary[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(PATHS_TAG);
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) params.set(key, value);
  }
  const { status, body } = await getJson<PathSummary[]>(
    `/paths?${params.toString()}`,
  );
  if (status !== 200) throw new Error(`Không tải được lộ trình (${status}).`);
  return body;
}

export async function fetchPath(slug: string): Promise<PathDetail | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag(PATHS_TAG);
  const { status, body } = await getJson<PathDetail>(
    `/paths/${encodeURIComponent(slug)}`,
  );
  if (status === 404) return null;
  if (status !== 200) throw new Error(`Không tải được lộ trình (${status}).`);
  return body;
}

export async function fetchStep(
  slug: string,
  stepSlug: string,
): Promise<StepDetail | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag(PATHS_TAG);
  const { status, body } = await getJson<StepDetail>(
    `/paths/${encodeURIComponent(slug)}/steps/${encodeURIComponent(stepSlug)}`,
  );
  if (status === 404) return null;
  if (status !== 200) throw new Error(`Không tải được bước học (${status}).`);
  return body;
}
