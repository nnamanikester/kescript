import { toHtml } from "hast-util-to-html";
import { visit } from "unist-util-visit";
import type { Element, Root } from "hast";
import { getPosts } from "@/lib/content";
import { processPost } from "@/lib/markdown/pipeline";
import { SITE } from "@/lib/site";

/** Feed readers don't run our components: degrade custom elements to plain HTML. */
function feedSafe(tree: Root): Root {
  visit(tree, "element", (node: Element) => {
    const id = String(node.properties.dataId ?? "");
    const link = (href: string, text: string) => {
      node.tagName = "p";
      node.properties = {};
      node.children = [{ type: "element", tagName: "a", properties: { href }, children: [{ type: "text", value: text }] }];
    };
    if (node.tagName === "youtube-embed") link(`https://www.youtube.com/watch?v=${id}`, "Watch on YouTube");
    else if (node.tagName === "tweet-embed") link(`https://x.com/i/status/${id}`, "View post on X");
    else if (node.tagName === "mermaid-diagram") {
      const chart = String(node.properties.dataChart ?? "");
      node.tagName = "pre";
      node.properties = {};
      node.children = [{ type: "element", tagName: "code", properties: {}, children: [{ type: "text", value: chart }] }];
    } else if (node.tagName === "a" && typeof node.properties.href === "string" && node.properties.href.startsWith("/")) {
      node.properties.href = SITE.url + node.properties.href;
    } else if (node.tagName === "img" && typeof node.properties.src === "string" && node.properties.src.startsWith("/")) {
      node.properties.src = SITE.url + node.properties.src;
    }
  });
  return tree;
}

export interface FeedItem {
  slug: string;
  url: string;
  title: string;
  description: string;
  date: string;
  updated?: string;
  tags: string[];
  html: string;
}

export async function getFeedItems(limit = 30): Promise<FeedItem[]> {
  const posts = (await getPosts()).slice(0, limit);
  return Promise.all(
    posts.map(async (p) => {
      const { tree } = await processPost(p.body);
      return {
        slug: p.slug,
        url: `${SITE.url}/blog/${p.slug}`,
        title: p.title,
        description: p.description,
        date: p.date,
        updated: p.updated,
        tags: p.tags,
        html: toHtml(feedSafe(tree)),
      };
    }),
  );
}
