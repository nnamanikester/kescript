/**
 * GitHub Issues as a CMS (the swyxkit model).
 *
 *  - Every issue in GH.owner/GH.repo that carries a published label AND was
 *    opened by an approved poster becomes a post.
 *  - An optional YAML frontmatter block at the top of the issue body overrides
 *    anything derived from the issue itself.
 *  - The same issue hosts the post's comments and reactions.
 *
 * When GitHub can't be reached (no network / bad token in local dev), we fall
 * back to markdown files in /content/blog so the site still builds and renders.
 */
import { cache } from "react";
import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { GH } from "@/lib/site";
import { isCategoryLabel, resolveCategory, toCategoryName } from "@/lib/categories";
import { readingTime, slugify } from "@/lib/utils";
import { toPlainText } from "@/lib/content-text";

export { toPlainText };

export const POSTS_TAG = "posts";
const REVALIDATE_SECONDS = 300;

export interface PostMeta {
  slug: string;
  title: string;
  subtitle?: string;
  description: string;
  /** YYYY-MM-DD */
  date: string;
  updated?: string;
  /** Slug, for URLs and matching. */
  category: string;
  /** Display name, e.g. "Case Study". */
  categoryName: string;
  tags: string[];
  image?: string;
  canonical?: string;
  featured: boolean;
  readingMinutes: number;
  words: number;
  /** Absent for local-file fallback posts — those have no discussion thread. */
  issueNumber?: number;
  issueUrl?: string;
  reactionCount: number;
  commentCount: number;
}

export interface Post extends PostMeta {
  /** Markdown body with the frontmatter removed. */
  body: string;
}

export interface GitHubIssue {
  number: number;
  title: string;
  body: string | null;
  html_url: string;
  created_at: string;
  updated_at: string;
  comments: number;
  user: { login: string } | null;
  labels: (string | { name?: string })[];
  reactions?: { total_count: number };
  pull_request?: unknown;
}

const SYSTEM_LABELS = new Set([...GH.publishedLabels, "featured"].map((l) => l.toLowerCase()));

function labelName(l: GitHubIssue["labels"][number]): string {
  return (typeof l === "string" ? l : l.name ?? "").toLowerCase();
}

function excerpt(body: string, max = 180): string {
  for (const block of body.split(/\n{2,}/)) {
    const trimmed = block.trim();
    if (!trimmed || /^(#|```|<|!\[|\||:::|\{%)/.test(trimmed)) continue;
    const text = toPlainText(trimmed);
    if (text.length < 40) continue;
    return text.length > max ? text.slice(0, max - 1).replace(/\s+\S*$/, "") + "…" : text;
  }
  const text = toPlainText(body);
  return text.length > max ? text.slice(0, max - 1) + "…" : text;
}

function toDay(value: unknown): string | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const s = String(value);
  return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : undefined;
}

function toTags(value: unknown): string[] | undefined {
  if (!value) return undefined;
  const raw = Array.isArray(value) ? value : String(value).split(",");
  return raw.map((t) => slugify(String(t).trim())).filter(Boolean);
}

/** Exported for tests. */
export function parseIssue(issue: GitHubIssue): Post {
  const { data: fm, content } = matter(issue.body ?? "");
  const labels = issue.labels.map(labelName).filter(Boolean);
  const categoryName = resolveCategory(issue.labels.map((l) => (typeof l === "string" ? l : (l.name ?? ""))), fm.category);
  const title = String(fm.title ?? issue.title).trim();
  const body = content.trim();
  const { minutes, words } = readingTime(body);

  return {
    slug: slugify(String(fm.slug ?? title)),
    title,
    subtitle: fm.subtitle ? String(fm.subtitle) : undefined,
    description: fm.description ? String(fm.description) : fm.excerpt ? String(fm.excerpt) : excerpt(body),
    date: toDay(fm.date) ?? issue.created_at.slice(0, 10),
    updated: toDay(fm.updated),
    category: slugify(categoryName),
    categoryName,
    tags: toTags(fm.tags) ?? labels.filter((l) => !SYSTEM_LABELS.has(l) && !isCategoryLabel(l)).map((l) => slugify(l)),
    image: fm.image ?? fm.cover_image ?? undefined,
    canonical: fm.canonical ?? undefined,
    featured: Boolean(fm.featured) || labels.includes("featured"),
    readingMinutes: minutes,
    words,
    issueNumber: issue.number,
    issueUrl: issue.html_url,
    reactionCount: issue.reactions?.total_count ?? 0,
    commentCount: issue.comments ?? 0,
    body,
  };
}

export function parseNextLink(header: string | null): string | null {
  if (!header) return null;
  const match = header.split(",").find((part) => /rel="next"/.test(part));
  return match?.match(/<([^>]+)>/)?.[1] ?? null;
}

export function githubHeaders(token = process.env.GITHUB_TOKEN): HeadersInit {
  return {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": `${GH.repo}-blog`,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function fetchIssuePosts(): Promise<Post[]> {
  const params = new URLSearchParams({
    state: "all",
    labels: GH.publishedLabels.join(","),
    per_page: "100",
    sort: "created",
    direction: "desc",
  });
  // A single approved poster means GitHub can filter for us.
  if (GH.approvedPosters.length === 1) params.set("creator", GH.approvedPosters[0]);

  let url: string | null = `https://api.github.com/repos/${GH.owner}/${GH.repo}/issues?${params}`;
  const posts: Post[] = [];
  for (let page = 0; url && page < 50; page++) {
    const res: Response = await fetch(url, {
      headers: githubHeaders(),
      next: { revalidate: REVALIDATE_SECONDS, tags: [POSTS_TAG] },
    });
    if (!res.ok) throw new Error(`GitHub ${res.status} ${res.statusText}`);
    const issues = (await res.json()) as GitHubIssue[];
    for (const issue of issues) {
      if (issue.pull_request) continue;
      if (!issue.user || !(GH.approvedPosters as readonly string[]).includes(issue.user.login)) continue;
      posts.push(parseIssue(issue));
    }
    url = parseNextLink(res.headers.get("link"));
  }
  return posts;
}

/**
 * GitHub's label-filtered issue list trails a write by a few seconds. Revalidating
 * inside that window rebuilds pages from the old list and caches them for
 * REVALIDATE_SECONDS (a just-published post 404s for five minutes), so writes
 * wait until the list agrees before revalidating.
 *
 * `listed`: the issue should be on the blog, at least as fresh as `updatedAt`;
 * otherwise it should be gone. Resolves false on timeout; the revalidate timer
 * catches up from there.
 */
export async function waitForListing(
  issue: { number: number; updatedAt?: string },
  listed: boolean,
  { timeoutMs = 12_000, intervalMs = 800 } = {},
): Promise<boolean> {
  const params = new URLSearchParams({
    state: "all",
    labels: GH.publishedLabels.join(","),
    per_page: "100",
    // Just-written issues sort first, so one page is enough.
    sort: "updated",
    direction: "desc",
  });
  const url = `https://api.github.com/repos/${GH.owner}/${GH.repo}/issues?${params}`;
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    try {
      const res = await fetch(url, { headers: githubHeaders(), cache: "no-store" });
      if (res.ok) {
        const found = ((await res.json()) as GitHubIssue[]).find((i) => i.number === issue.number);
        const fresh = found && (!issue.updatedAt || found.updated_at >= issue.updatedAt);
        if (listed ? fresh : !found) return true;
      }
    } catch {
      // Network trouble: keep trying until the deadline.
    }
    if (Date.now() + intervalMs > deadline) return false;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

async function readLocalPosts(): Promise<Post[]> {
  const dir = path.join(process.cwd(), "content", "blog");
  let files: string[] = [];
  try {
    files = (await fs.readdir(dir)).filter((f) => /\.mdx?$/.test(f));
  } catch {
    return [];
  }
  return Promise.all(
    files.map(async (file) => {
      const raw = await fs.readFile(path.join(dir, file), "utf8");
      const { data } = matter(raw);
      const post = parseIssue({
        number: 0,
        title: String(data.title ?? file.replace(/\.mdx?$/, "")),
        body: raw,
        html_url: "",
        created_at: toDay(data.date) ?? "1970-01-01",
        updated_at: "",
        comments: 0,
        user: null,
        labels: [],
      });
      if (!data.slug) post.slug = slugify(file.replace(/\.mdx?$/, ""));
      return { ...post, issueNumber: undefined, issueUrl: undefined };
    }),
  );
}

/** All posts, newest first. Deduped per request; cached across requests via fetch. */
export const getPosts = cache(async (): Promise<Post[]> => {
  let posts: Post[];
  try {
    posts = await fetchIssuePosts();
  } catch (err) {
    console.warn(`[content] GitHub unavailable (${(err as Error).message}); using /content/blog`);
    posts = await readLocalPosts();
  }
  const seen = new Set<string>();
  return posts
    .sort((a, b) => b.date.localeCompare(a.date))
    .filter((p) => (seen.has(p.slug) ? false : (seen.add(p.slug), true)));
});

export function toMeta(post: Post): PostMeta {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { body, ...meta } = post;
  return meta;
}

export async function getPostMetas(): Promise<PostMeta[]> {
  return (await getPosts()).map(toMeta);
}

export async function getPost(slug: string): Promise<Post | null> {
  return (await getPosts()).find((p) => p.slug === slug) ?? null;
}

export async function getTags(): Promise<{ tag: string; count: number }[]> {
  const counts = new Map<string, number>();
  for (const p of await getPosts()) for (const t of p.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export interface CategoryInfo {
  slug: string;
  name: string;
  count: number;
}

/** Names from the repo's `category:*` labels, including ones no post uses yet. */
async function fetchCategoryLabels(): Promise<string[]> {
  let url: string | null = `https://api.github.com/repos/${GH.owner}/${GH.repo}/labels?per_page=100`;
  const names: string[] = [];
  for (let page = 0; url && page < 10; page++) {
    const res: Response = await fetch(url, {
      headers: githubHeaders(),
      next: { revalidate: REVALIDATE_SECONDS, tags: [POSTS_TAG] },
    });
    if (!res.ok) throw new Error(`GitHub ${res.status} ${res.statusText}`);
    for (const { name } of (await res.json()) as { name: string }[]) {
      if (isCategoryLabel(name) && toCategoryName(name)) names.push(toCategoryName(name));
    }
    url = parseNextLink(res.headers.get("link"));
  }
  return names;
}

/** Every category: the repo's labels plus any a post names in frontmatter. Most used first. */
export const getCategories = cache(async (): Promise<CategoryInfo[]> => {
  let names: string[] = [];
  try {
    names = await fetchCategoryLabels();
  } catch (err) {
    console.warn(`[content] couldn't list category labels (${(err as Error).message})`);
  }
  const all = new Map<string, CategoryInfo>();
  for (const name of names) all.set(slugify(name), { slug: slugify(name), name, count: 0 });
  for (const p of await getPosts()) {
    const c = all.get(p.category) ?? { slug: p.category, name: p.categoryName, count: 0 };
    c.count++;
    all.set(c.slug, c);
  }
  return [...all.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
});

/** Featured first (in date order), then the rest. */
export async function getFeatured(limit = 5): Promise<PostMeta[]> {
  const posts = await getPostMetas();
  return [...posts.filter((p) => p.featured), ...posts.filter((p) => !p.featured)].slice(0, limit);
}

/** Ranked by GitHub engagement: reactions + 2x comments. */
export async function getMostDiscussed(limit = 3): Promise<PostMeta[]> {
  const posts = await getPostMetas();
  return posts
    .filter((p) => p.reactionCount + p.commentCount > 0)
    .sort((a, b) => b.reactionCount + 2 * b.commentCount - (a.reactionCount + 2 * a.commentCount))
    .slice(0, limit);
}

export async function getRelated(post: PostMeta, limit = 3): Promise<PostMeta[]> {
  const posts = await getPostMetas();
  return posts
    .filter((p) => p.slug !== post.slug)
    .map((p) => ({
      p,
      score: p.tags.filter((t) => post.tags.includes(t)).length * 2 + (p.category === post.category ? 1 : 0),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || b.p.date.localeCompare(a.p.date))
    .slice(0, limit)
    .map((x) => x.p);
}

/** Client-side search document: metadata plus a bounded slice of body text. */
export interface SearchDoc extends PostMeta {
  text: string;
}

export async function getSearchDocs(): Promise<SearchDoc[]> {
  return (await getPosts()).map((p) => ({ ...toMeta(p), text: toPlainText(p.body).slice(0, 6000) }));
}
