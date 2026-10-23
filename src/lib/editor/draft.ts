/** What the writer edits. Client-safe: no Node APIs, no secrets. */
import { toCategoryName } from "@/lib/categories";
import { DEFAULT_CATEGORY } from "@/lib/site";
import { slugify } from "@/lib/utils";

/** On GitHub: a `published` issue is on the blog; a `draft` issue isn't. */
export type PostStatus = "draft" | "published";

export interface PostDraft {
  title: string;
  subtitle: string;
  /** SEO description; empty means "derive from the first paragraph". */
  description: string;
  /** YYYY-MM-DD */
  date: string;
  /** YYYY-MM-DD or empty */
  updated: string;
  /** Display name; the post gets the matching `category:<Name>` label. */
  category: string;
  tags: string[];
  /** Social card image URL; empty means the generated card. */
  image: string;
  canonical: string;
  featured: boolean;
  /** Empty means "derive from the title". */
  slug: string;
  /** Markdown, without frontmatter. */
  body: string;
}

export function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function emptyDraft(): PostDraft {
  return {
    title: "",
    subtitle: "",
    description: "",
    date: today(),
    updated: "",
    category: "Essay",
    tags: [],
    image: "",
    canonical: "",
    featured: false,
    slug: "",
    body: "",
  };
}

export function draftSlug(d: Pick<PostDraft, "slug" | "title">): string {
  return slugify(d.slug || d.title);
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Server-side gate for anything a client sends. Returns a clean draft or an
 * error message. Drafts may be empty; GitHub only insists on a title.
 */
export function validateDraft(input: unknown, { publishing = true } = {}): { draft: PostDraft } | { error: string } {
  if (!input || typeof input !== "object") return { error: "Missing post" };
  const d = input as Record<string, unknown>;
  const str = (k: string, max: number) => (typeof d[k] === "string" ? (d[k] as string).trim().slice(0, max) : "");

  const draft: PostDraft = {
    title: str("title", 300),
    subtitle: str("subtitle", 500),
    description: str("description", 500),
    date: str("date", 10),
    updated: str("updated", 10),
    category: toCategoryName(str("category", 100)) || DEFAULT_CATEGORY,
    tags: Array.isArray(d.tags) ? [...new Set(d.tags.map((t) => slugify(String(t))).filter(Boolean))].slice(0, 12) : [],
    image: str("image", 2000),
    canonical: str("canonical", 2000),
    featured: d.featured === true,
    slug: slugify(str("slug", 200)),
    body: typeof d.body === "string" ? d.body : "",
  };

  if (!draft.title) return { error: publishing ? "Give the post a title" : "Give the draft a title first" };
  if (publishing && !draft.body.trim()) return { error: "The post is empty" };
  if (draft.body.length > 60_000) return { error: "Posts are limited to 60,000 characters (a GitHub issue limit)" };
  if (!DAY.test(draft.date)) return { error: "Pick a publish date" };
  if (draft.updated && !DAY.test(draft.updated)) return { error: "The updated date is invalid" };
  for (const [k, v] of [["image", draft.image], ["canonical", draft.canonical]] as const) {
    if (v && !/^https?:\/\//.test(v)) return { error: `The ${k === "image" ? "social image" : "canonical"} URL must start with https://` };
  }
  if (!draftSlug(draft)) return { error: "The slug is empty" };
  return { draft };
}
