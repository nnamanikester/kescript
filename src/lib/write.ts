/**
 * The author's write path. Every call here uses the signed-in author's own
 * GitHub token, so issues are opened by them (which is what makes them posts)
 * and the GitHub App can only touch the repos it is installed on.
 */
import matter from "gray-matter";
import { CATEGORIES, GH, type Category } from "@/lib/site";
import { getPosts, githubHeaders, type GitHubIssue } from "@/lib/content";
import { GitHubError } from "@/lib/github";
import { getSession, type Session } from "@/lib/session";
import { draftSlug, type PostDraft, type PostStatus } from "@/lib/editor/draft";

export type { PostStatus };
import { slugify } from "@/lib/utils";

export const ASSETS_BRANCH = "assets";

export function isOwner(login: string | undefined | null): boolean {
  return Boolean(login) && (GH.approvedPosters as readonly string[]).includes(login!);
}

export async function getOwnerSession(): Promise<Session | null> {
  const session = await getSession();
  return session && isOwner(session.login) ? session : null;
}

const REPO = `https://api.github.com/repos/${GH.owner}/${GH.repo}`;

async function rest<T>(token: string, method: string, url: string, body?: unknown): Promise<T> {
  const res = await fetch(url.startsWith("http") ? url : REPO + url, {
    method,
    headers: { ...githubHeaders(token), ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  if (!res.ok) {
    const detail = ((await res.json().catch(() => null)) as { message?: string } | null)?.message;
    throw new GitHubError(detail ? `GitHub: ${detail}` : `GitHub ${res.status}`, res.status);
  }
  return (res.status === 204 ? null : await res.json()) as T;
}

/* ─────────────────────────────── frontmatter ─────────────────────────────── */

/** Keys the writer owns. Anything else already in an issue's frontmatter is kept as-is. */
const KNOWN = ["title", "slug", "date", "updated", "category", "subtitle", "description", "excerpt", "tags", "image", "cover_image", "canonical", "featured"];

export function issueBody(draft: PostDraft, extra: Record<string, unknown> = {}): string {
  const fm: Record<string, unknown> = { slug: draftSlug(draft), date: draft.date };
  if (draft.updated) fm.updated = draft.updated;
  fm.category = draft.category;
  if (draft.subtitle) fm.subtitle = draft.subtitle;
  if (draft.description) fm.description = draft.description;
  if (draft.tags.length) fm.tags = draft.tags;
  if (draft.image) fm.image = draft.image;
  if (draft.canonical) fm.canonical = draft.canonical;
  if (draft.featured) fm.featured = true;
  return matter.stringify(`\n${draft.body.trim()}\n`, { ...fm, ...extra });
}

function str(v: unknown): string {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return v == null ? "" : String(v);
}

export function draftFromIssue(issue: GitHubIssue): { draft: PostDraft; extra: Record<string, unknown> } {
  const { data, content } = matter(issue.body ?? "");
  const extra = Object.fromEntries(Object.entries(data).filter(([k]) => !KNOWN.includes(k)));
  const title = str(data.title ?? issue.title).trim();
  const tags = Array.isArray(data.tags) ? data.tags : data.tags ? String(data.tags).split(",") : [];
  return {
    extra,
    draft: {
      title,
      subtitle: str(data.subtitle),
      description: str(data.description ?? data.excerpt),
      date: str(data.date).slice(0, 10) || issue.created_at.slice(0, 10),
      updated: str(data.updated).slice(0, 10),
      category: (CATEGORIES as readonly string[]).includes(str(data.category).toLowerCase())
        ? (str(data.category).toLowerCase() as Category)
        : "note",
      tags: tags.map((t) => slugify(String(t).trim())).filter(Boolean),
      image: str(data.image ?? data.cover_image),
      canonical: str(data.canonical),
      featured: data.featured === true,
      // Pin the URL: an untitled-slug post would otherwise move when its title changes.
      slug: slugify(str(data.slug) || title),
      body: content.trim(),
    },
  };
}

export const DRAFT_LABEL = "draft";

const labelNames = (issue: GitHubIssue) => issue.labels.map((l) => (typeof l === "string" ? l : (l.name ?? ""))).filter(Boolean);
const isPublishedLabel = (name: string) => (GH.publishedLabels as readonly string[]).some((l) => l.toLowerCase() === name.toLowerCase());

export function statusOf(issue: GitHubIssue): PostStatus {
  return labelNames(issue).some(isPublishedLabel) ? "published" : "draft";
}

/** Swap the publish/draft label and keep every other label the issue has. */
function labelsFor(issue: GitHubIssue, status: PostStatus): string[] {
  const rest = labelNames(issue).filter((l) => !isPublishedLabel(l) && l.toLowerCase() !== DRAFT_LABEL);
  return [...rest, status === "published" ? GH.publishedLabels[0] : DRAFT_LABEL];
}

async function readIssue(token: string, number: number): Promise<GitHubIssue> {
  const issue = await rest<GitHubIssue>(token, "GET", `/issues/${number}`);
  if (issue.pull_request || !isOwner(issue.user?.login)) throw new GitHubError("That issue isn't one of your posts", 404);
  return issue;
}

export interface EditablePost {
  number: number;
  url: string;
  status: PostStatus;
  draft: PostDraft;
}

export async function getEditablePost(token: string, number: number): Promise<EditablePost> {
  const issue = await readIssue(token, number);
  return { number: issue.number, url: issue.html_url, status: statusOf(issue), draft: draftFromIssue(issue).draft };
}

export interface DraftSummary {
  number: number;
  title: string;
  updated: string;
  url: string;
}

/** Issues labelled `draft`, newest edit first. */
export async function listDrafts(token: string): Promise<DraftSummary[]> {
  const params = new URLSearchParams({ labels: DRAFT_LABEL, state: "all", sort: "updated", direction: "desc", per_page: "100" });
  if (GH.approvedPosters.length === 1) params.set("creator", GH.approvedPosters[0]);
  const issues = await rest<GitHubIssue[]>(token, "GET", `/issues?${params}`);
  return issues
    .filter((i) => !i.pull_request && isOwner(i.user?.login) && statusOf(i) === "draft")
    .map((i) => ({ number: i.number, title: i.title, updated: i.updated_at, url: i.html_url }));
}

async function assertSlugFree(slug: string, exceptIssue?: number) {
  const clash = (await getPosts()).find((p) => p.slug === slug && p.issueNumber !== exceptIssue);
  if (clash) throw new GitHubError(`"/blog/${slug}" is already used by “${clash.title}”. Change the slug in Settings.`, 409);
}

const LABEL_STYLE: Record<string, { color: string; description: string }> = {
  [DRAFT_LABEL]: { color: "8a8a8a", description: "Blog draft — not shown on the site" },
};

async function ensureLabel(token: string, name: string) {
  try {
    await rest(token, "GET", `/labels/${encodeURIComponent(name)}`);
  } catch (err) {
    if (!(err instanceof GitHubError) || err.status !== 404) throw err;
    const style = LABEL_STYLE[name] ?? { color: "c2410c", description: "Shown on the blog" };
    await rest(token, "POST", "/labels", { name, ...style });
  }
}

export interface PublishResult {
  number: number;
  url: string;
  slug: string;
  status: PostStatus;
}

const result = (issue: GitHubIssue, slug: string): PublishResult => ({
  number: issue.number,
  url: issue.html_url,
  slug,
  status: statusOf(issue),
});

/** A new issue, either straight to the blog or parked as a draft. */
export async function createPost(token: string, draft: PostDraft, status: PostStatus): Promise<PublishResult> {
  const slug = draftSlug(draft);
  if (status === "published") await assertSlugFree(slug);
  const label = status === "published" ? GH.publishedLabels[0] : DRAFT_LABEL;
  await ensureLabel(token, label);
  const issue = await rest<GitHubIssue>(token, "POST", "/issues", { title: draft.title, body: issueBody(draft), labels: [label] });
  return result(issue, slug);
}

/** Save the content; pass `status` to also publish or unpublish in the same request. */
export async function updatePost(token: string, number: number, draft: PostDraft, status?: PostStatus): Promise<PublishResult> {
  const current = await readIssue(token, number);
  const next = status ?? statusOf(current);
  const slug = draftSlug(draft);
  if (next === "published") {
    // A live post saved through the draft path still has to be publishable.
    if (!draft.body.trim()) throw new GitHubError("The post is empty", 422);
    await assertSlugFree(slug, number);
  }
  const patch: Record<string, unknown> = { title: draft.title, body: issueBody(draft, draftFromIssue(current).extra) };
  if (next !== statusOf(current)) {
    await ensureLabel(token, next === "published" ? GH.publishedLabels[0] : DRAFT_LABEL);
    patch.labels = labelsFor(current, next);
  }
  return result(await rest<GitHubIssue>(token, "PATCH", `/issues/${number}`, patch), slug);
}

/** Take a post off the site without losing it: it goes back to being a draft. */
export async function unpublishPost(token: string, number: number): Promise<PublishResult> {
  const current = await readIssue(token, number);
  await ensureLabel(token, DRAFT_LABEL);
  const issue = await rest<GitHubIssue>(token, "PATCH", `/issues/${number}`, { labels: labelsFor(current, "draft") });
  return result(issue, draftSlug(draftFromIssue(issue).draft));
}

/** "deleted": the issue is gone. "closed": GitHub wouldn't delete it, so it was closed and unlabelled instead. */
export type DeleteOutcome = "deleted" | "closed";

/**
 * Ask GitHub to delete an issue for good. Only GraphQL can, and only for repo
 * admins; anything short of a clean success returns GitHub's reason instead.
 */
async function tryDeleteIssue(token: string, nodeId: string): Promise<{ ok: true } | { ok: false; reason: string }> {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { ...githubHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({
      query: "mutation($id: ID!) { deleteIssue(input: { issueId: $id }) { clientMutationId } }",
      variables: { id: nodeId },
    }),
    cache: "no-store",
  });
  if (res.status === 401) throw new GitHubError("GitHub: Bad credentials", 401);
  const data = (await res.json().catch(() => null)) as {
    data?: { deleteIssue?: unknown } | null;
    errors?: { message?: string }[];
    message?: string;
  } | null;
  if (!res.ok || !data) return { ok: false, reason: data?.message ?? `HTTP ${res.status}` };
  if (data.errors?.length) return { ok: false, reason: data.errors.map((e) => e.message).join("; ") };
  // `deleteIssue: null` without errors is not a success either.
  if (!data.data?.deleteIssue) return { ok: false, reason: "no deleteIssue result" };
  return { ok: true };
}

/** GitHub answers 404 or 410 for a deleted issue. */
async function issueGone(token: string, number: number): Promise<boolean> {
  try {
    await rest(token, "GET", `/issues/${number}`);
    return false;
  } catch (err) {
    if (err instanceof GitHubError && (err.status === 404 || err.status === 410)) return true;
    throw err;
  }
}

/**
 * Delete a draft for good, or, when GitHub won't allow that, close it and
 * drop the `draft` label so it leaves the drafts list. Live posts are refused:
 * unpublishing first is the deliberate step. Each outcome is checked against
 * GitHub before it's reported, and every step is logged.
 */
export async function deleteDraft(token: string, number: number): Promise<DeleteOutcome> {
  const issue = (await readIssue(token, number)) as GitHubIssue & { node_id: string };
  if (statusOf(issue) === "published") throw new GitHubError("This post is live. Unpublish it first, then delete the draft.", 409);

  const attempt = await tryDeleteIssue(token, issue.node_id);
  if (attempt.ok && (await issueGone(token, number))) {
    console.info(`[delete] #${number}: deleted`);
    return "deleted";
  }
  console.info(`[delete] #${number}: GitHub didn't delete it (${attempt.ok ? "still there after deleteIssue" : attempt.reason}); closing instead`);

  const labels = labelNames(issue).filter((l) => l.toLowerCase() !== DRAFT_LABEL);
  const closed = await rest<GitHubIssue>(token, "PATCH", `/issues/${number}`, { state: "closed", state_reason: "not_planned", labels });
  const left = labelNames(closed);
  if (left.some((l) => l.toLowerCase() === DRAFT_LABEL)) {
    console.error(`[delete] #${number}: closed, but GitHub kept the draft label`, left);
    throw new GitHubError("GitHub closed the issue but kept its draft label. Remove the label on GitHub.", 502);
  }
  console.info(`[delete] #${number}: closed and unlabelled (labels now: ${left.join(", ") || "none"})`);
  return "closed";
}

/* ───────────────────────────────── images ───────────────────────────────── */

export const IMAGE_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

/**
 * Images live on an orphan `assets` branch: no CMS, no storage bill, and no
 * production deploy per upload. The branch carries a vercel.json that turns
 * deployments off for itself.
 */
async function ensureAssetsBranch(token: string) {
  try {
    await rest(token, "GET", `/branches/${ASSETS_BRANCH}`);
    return;
  } catch (err) {
    if (!(err instanceof GitHubError) || err.status !== 404) throw err;
  }
  const tree = await rest<{ sha: string }>(token, "POST", "/git/trees", {
    tree: [
      {
        path: "vercel.json",
        mode: "100644",
        type: "blob",
        content: JSON.stringify({ git: { deploymentEnabled: { [ASSETS_BRANCH]: false } } }, null, 2) + "\n",
      },
      {
        path: "README.md",
        mode: "100644",
        type: "blob",
        content: "# Blog images\n\nUploaded from the editor at /write. Referenced by posts — don't rename or delete.\n",
      },
    ],
  });
  const commit = await rest<{ sha: string }>(token, "POST", "/git/commits", {
    message: "Create assets branch for blog images",
    tree: tree.sha,
    parents: [],
  });
  await rest(token, "POST", "/git/refs", { ref: `refs/heads/${ASSETS_BRANCH}`, sha: commit.sha });
}

async function putImage(token: string, bytes: Buffer, ext: string): Promise<string> {
  await ensureAssetsBranch(token);
  const hash = Buffer.from(await crypto.subtle.digest("SHA-256", new Uint8Array(bytes))).toString("hex").slice(0, 20);
  const now = new Date();
  const filePath = `images/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${hash}.${ext}`;
  try {
    await rest(token, "PUT", `/contents/${filePath}`, {
      message: `Add ${filePath}`,
      content: bytes.toString("base64"),
      branch: ASSETS_BRANCH,
    });
  } catch (err) {
    // 422 = this exact file already exists (same content hash). That's a success.
    if (!(err instanceof GitHubError) || err.status !== 422) throw err;
  }
  return `https://raw.githubusercontent.com/${GH.owner}/${GH.repo}/${ASSETS_BRANCH}/${filePath}`;
}

/**
 * The site token first: giving the GitHub App "Contents" access would make
 * every commenter's sign-in screen ask for write access to code. The author's
 * own token is the fallback.
 */
export async function uploadImage(token: string, bytes: Buffer, ext: string): Promise<string> {
  const tokens = [process.env.GITHUB_TOKEN, token].filter((t): t is string => Boolean(t));
  let lastError: unknown;
  for (const t of tokens) {
    try {
      return await putImage(t, bytes, ext);
    } catch (err) {
      lastError = err;
      if (!(err instanceof GitHubError) || (err.status !== 403 && err.status !== 404)) throw err;
    }
  }
  throw new GitHubError(
    "GitHub refused the upload. Give GITHUB_TOKEN “Contents: Read and write” on the kescript repo (see README → Writing from the site).",
    lastError instanceof GitHubError ? lastError.status : 403,
  );
}
