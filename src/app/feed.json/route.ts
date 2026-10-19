import { getFeedItems } from "@/lib/feed";
import { SITE } from "@/lib/site";

export const revalidate = 300;

/** https://www.jsonfeed.org/version/1.1/ */
export async function GET() {
  const items = await getFeedItems();
  return Response.json(
    {
      version: "https://jsonfeed.org/version/1.1",
      title: SITE.title,
      home_page_url: SITE.url,
      feed_url: `${SITE.url}/feed.json`,
      description: SITE.description,
      icon: `${SITE.url}/icon-192.png`,
      language: "en",
      authors: [{ name: SITE.author, url: SITE.url, avatar: `${SITE.url}/images/profile.jpg` }],
      items: items.map((i) => ({
        id: i.url,
        url: i.url,
        title: i.title,
        summary: i.description,
        content_html: i.html,
        date_published: new Date(i.date).toISOString(),
        ...(i.updated ? { date_modified: new Date(i.updated).toISOString() } : {}),
        tags: i.tags,
      })),
    },
    {
      headers: {
        "Content-Type": "application/feed+json; charset=utf-8",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
      },
    },
  );
}
