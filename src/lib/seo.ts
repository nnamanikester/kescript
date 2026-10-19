/**
 * Every page's metadata goes through here, so none of it can be half-set.
 *
 * Why this exists: Next merges metadata *shallowly*. A page that sets
 * `title` but not `openGraph` inherits the root's whole openGraph object —
 * its URL, title and image — so sharing /about would preview the homepage.
 * This helper always returns the complete set for the page.
 */
import type { Metadata } from "next";
import { SITE } from "@/lib/site";

export const FEEDS = { "application/rss+xml": "/rss.xml", "application/feed+json": "/feed.json" };

export function ogImageUrl(title: string, kicker: string, meta?: string): string {
  const q = new URLSearchParams({ title, kicker, ...(meta ? { meta } : {}) });
  return `/api/og?${q}`;
}

interface PageSeo {
  /** Shown in the tab and search results (the template appends " — kescript"). */
  title: string;
  description: string;
  /** Path for the canonical URL, e.g. "/about". */
  path: string;
  /** Title on the social card, when it should differ from the tab title. */
  socialTitle?: string;
  /** Small mono line on the generated card, e.g. "~/about". Defaults to the path. */
  kicker?: string;
  image?: string;
  noindex?: boolean;
  /** Use the title as-is, without the site suffix. */
  absoluteTitle?: boolean;
}

export function pageMetadata({ title, description, path, socialTitle, kicker, image, noindex, absoluteTitle }: PageSeo): Metadata {
  const card = image ?? ogImageUrl(socialTitle ?? title, kicker ?? `~${path === "/" ? "" : path}`);
  const social = socialTitle ?? title;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path, types: FEEDS },
    openGraph: {
      type: "website",
      siteName: SITE.name,
      locale: "en_US",
      url: path,
      title: social,
      description,
      images: [{ url: card, width: 1200, height: 630, alt: social }],
    },
    twitter: { card: "summary_large_image", creator: SITE.twitterHandle, title: social, description, images: [card] },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

/* ───────────────────────────── tag names ───────────────────────────── */

const ACRONYMS = new Set(["ai", "ml", "llm", "llms", "rag", "api", "apis", "ui", "ux", "ci", "cd", "aws", "sql", "css", "html", "js", "ts", "e2e", "ios", "sdk", "cli", "fcm", "jwt", "seo", "gpt"]);
const SPECIAL: Record<string, string> = {
  typescript: "TypeScript",
  javascript: "JavaScript",
  nextjs: "Next.js",
  "next-js": "Next.js",
  nodejs: "Node.js",
  graphql: "GraphQL",
  github: "GitHub",
  nestjs: "NestJS",
  fastapi: "FastAPI",
  postgresql: "PostgreSQL",
  mongodb: "MongoDB",
  langchain: "LangChain",
  langgraph: "LangGraph",
  openai: "OpenAI",
  webrtc: "WebRTC",
  devops: "DevOps",
};

/** "slack-api" → "Slack API", "typescript" → "TypeScript", "rag" → "RAG". */
export function tagLabel(tag: string): string {
  if (SPECIAL[tag]) return SPECIAL[tag];
  return tag
    .split("-")
    .map((w) => SPECIAL[w] ?? (ACRONYMS.has(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

/** Tag pages with fewer posts than this are thin; keep them out of the index. */
export const MIN_POSTS_TO_INDEX_TAG = 2;
