import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

/** Generated so the sitemap URL follows NEXT_PUBLIC_SITE_URL instead of a hard-coded domain. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Auth, comment writes and previews have nothing worth indexing.
        // /api/og stays crawlable: social cards are fetched by bots.
        disallow: ["/api/auth/", "/api/thread/", "/api/preview", "/api/revalidate"],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
