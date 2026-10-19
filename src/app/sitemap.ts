import type { MetadataRoute } from "next";
import { getPostMetas, getTags } from "@/lib/content";
import { SITE } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, tags] = await Promise.all([getPostMetas(), getTags()]);
  const latest = posts[0]?.date ? new Date(posts[0].date) : new Date();
  const pages = ["", "/blog", "/about", "/now", "/projects", "/uses", "/tags", "/colophon", "/subscribe"].map((p) => ({
    url: `${SITE.url}${p}`,
    lastModified: p === "" || p === "/blog" ? latest : undefined,
    changeFrequency: p === "/blog" ? ("weekly" as const) : ("monthly" as const),
    priority: p === "" ? 1 : p === "/blog" ? 0.9 : 0.6,
  }));
  return [
    ...pages,
    ...posts.map((p) => ({
      url: `${SITE.url}/blog/${p.slug}`,
      lastModified: new Date(p.updated ?? p.date),
      changeFrequency: "yearly" as const,
      priority: 0.8,
    })),
    ...tags.map(({ tag }) => ({ url: `${SITE.url}/tags/${tag}`, changeFrequency: "monthly" as const, priority: 0.3 })),
  ];
}
