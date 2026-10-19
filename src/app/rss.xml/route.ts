import { getFeedItems } from "@/lib/feed";
import { SITE } from "@/lib/site";
import { escapeXml } from "@/lib/utils";

export const revalidate = 300;

export async function GET() {
  const items = await getFeedItems();
  const cdata = (s: string) => `<![CDATA[${s.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(SITE.title)}</title>
    <link>${SITE.url}</link>
    <description>${escapeXml(SITE.description)}</description>
    <language>en</language>
    <lastBuildDate>${new Date(items[0]?.date ?? Date.now()).toUTCString()}</lastBuildDate>
    <atom:link href="${SITE.url}/rss.xml" rel="self" type="application/rss+xml"/>
    <image><url>${SITE.url}/icon-192.png</url><title>${escapeXml(SITE.title)}</title><link>${SITE.url}</link></image>
${items
  .map(
    (i) => `    <item>
      <title>${escapeXml(i.title)}</title>
      <link>${i.url}</link>
      <guid isPermaLink="true">${i.url}</guid>
      <pubDate>${new Date(i.date).toUTCString()}</pubDate>
      <dc:creator>${escapeXml(SITE.author)}</dc:creator>
      <description>${escapeXml(i.description)}</description>
      <content:encoded>${cdata(i.html)}</content:encoded>
${i.tags.map((t) => `      <category>${escapeXml(t)}</category>`).join("\n")}
    </item>`,
  )
  .join("\n")}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
    },
  });
}
