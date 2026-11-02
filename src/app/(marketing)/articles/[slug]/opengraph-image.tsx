import { ImageResponse } from "next/og";
import { fetchArticle } from "@/features/articles";

export const alt = "Bài viết trên Paper & Progress";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** A social-share card per article, in the site's colours. Members-only articles show only their title. */
export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await fetchArticle(slug);
  const title =
    result.kind === "not-found" ? "Paper & Progress" : result.article.title;
  const excerpt =
    result.kind === "not-found" ? "" : (result.article.excerpt ?? "");

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#F8F7F2",
        color: "#171717",
        padding: 64,
        border: "12px solid #171717",
      }}
    >
      <div
        style={{
          display: "flex",
          alignSelf: "flex-start",
          background: "#D8F75A",
          border: "4px solid #171717",
          borderRadius: 999,
          padding: "8px 24px",
          fontSize: 32,
          fontWeight: 700,
        }}
      >
        Paper &amp; Progress
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.1 }}>
          {title.length > 90 ? `${title.slice(0, 87)}...` : title}
        </div>
        {excerpt && (
          <div style={{ fontSize: 32, color: "#737373", lineHeight: 1.3 }}>
            {excerpt.length > 140 ? `${excerpt.slice(0, 137)}...` : excerpt}
          </div>
        )}
      </div>
    </div>,
    size,
  );
}
