import { buildRssFeed, getDevlogEntries } from "@/features/devlog";

// Set NEXT_PUBLIC_SITE_URL to the real address so the feed links work outside
// local development.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function GET() {
  const entries = await getDevlogEntries();

  return new Response(
    buildRssFeed(entries, {
      title: "Paper & Progress - Devlog",
      description: "Nhật ký phát triển Paper & Progress.",
      siteUrl: SITE_URL,
      pagePath: "/devlog",
    }),
    { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } },
  );
}
