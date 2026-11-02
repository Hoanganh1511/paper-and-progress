import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { articleTag, LIST_TAG } from "@/features/articles";

function isAuthorized(given: string | null) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * The backend calls this after an article is published, edited, archived or
 * deleted. The secret is in a header, not the URL, so it stays out of logs.
 * `expire: 0` drops the cached page at once: an article switched from public to
 * members-only must not stay readable for the rest of the cache time.
 */
export async function POST(request: Request) {
  if (!isAuthorized(request.headers.get("x-revalidate-secret"))) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as { slug?: unknown };
  revalidateTag(LIST_TAG, { expire: 0 });
  if (typeof body.slug === "string" && body.slug.length > 0) {
    revalidateTag(articleTag(body.slug), { expire: 0 });
  }
  return Response.json({ revalidated: true });
}
