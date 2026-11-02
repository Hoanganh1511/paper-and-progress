import type { SearchResults } from "./types";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/v1`;

/** The backend rejects anything shorter, so the page does not ask. */
export const MIN_QUERY_LENGTH = 2;

/** Read per request: results change as content is published, so nothing is cached. */
export async function fetchSearch(q: string): Promise<SearchResults> {
  const response = await fetch(
    `${API_BASE}/search?${new URLSearchParams({ q })}`,
    { headers: { accept: "application/json" }, cache: "no-store" },
  );
  if (!response.ok)
    throw new Error(`Không tìm kiếm được (${response.status}).`);
  return (await response.json()) as SearchResults;
}
