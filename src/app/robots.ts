import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The writing tools, saved lists and the API are not for search engines.
      disallow: ["/write", "/articles/saved", "/admin", "/api/"],
    },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
