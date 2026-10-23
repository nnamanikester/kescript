import { getPosts } from "@/lib/content";
import { toPlainText } from "@/lib/content-text";
import { SITE } from "@/lib/site";
import { KeywordSearch, RAGBase, type Passage } from "@/lib/rag";

/** What the search knows about the post a passage came from. */
export interface PostInfo {
  slug: string;
  title: string;
  description: string;
  tags: string[];
}

export type BlogSearch = KeywordSearch<PostInfo>;

/** The post being written, as the editor sends it. */
export interface DraftInput {
  title: string;
  subtitle: string;
  description: string;
  tags: string[];
  slug: string;
  body: string;
}

/** A search over every published post. Rebuilt per request: a few milliseconds at blog scale. */
export async function loadBlogSearch(): Promise<BlogSearch> {
  const posts = await getPosts();
  return KeywordSearch.fromMarkdown(
    posts.map((post) => ({
      text: `${post.title}\n\n${post.body}`,
      meta: { slug: post.slug, title: post.title, description: post.description, tags: post.tags },
    })),
    { clean: toPlainText },
  );
}

/** Goes into every task's instructions, so suggestions sound like the blog. */
export const VOICE = `The blog is ${SITE.name}, by ${SITE.author}: "${SITE.description}" The voice is plain, direct and first person, specific rather than grand, and never salesy.`;

/**
 * A RAG task over the blog's own posts. Shows the model passages from other
 * posts (never the one being written), at most `perPost` from each.
 */
export abstract class BlogTask<Input extends { slug: string }, Output> extends RAGBase<Input, Output, PostInfo> {
  protected perPost = 1;

  protected pickSources(found: Passage<PostInfo>[], input: Input): Passage<PostInfo>[] {
    const taken = new Map<string, number>();
    const fromOtherPosts = found.filter(({ meta }) => {
      if (meta.slug === input.slug) return false;
      const count = taken.get(meta.slug) ?? 0;
      taken.set(meta.slug, count + 1);
      return count < this.perPost;
    });
    return fromOtherPosts.slice(0, 5);
  }
}

/* ─────────── prompt pieces the draft tasks share ─────────── */

/** What to search for when the input is a draft: its title and opening. */
export function draftSearchQuery(draft: DraftInput): string {
  return `${draft.title} ${draft.subtitle} ${toPlainText(draft.body).slice(0, 1500)}`;
}

/** Related posts as a list of title, description and tags; with `voice`, a sample of each one's prose too. */
export function relatedPosts(sources: Passage<PostInfo>[], { voice = false } = {}): string {
  if (!sources.length) return "";
  const lines = sources.map(({ meta, text }) => {
    const line = `- "${meta.title}": ${meta.description}${meta.tags.length ? ` (tags: ${meta.tags.join(", ")})` : ""}`;
    return voice ? `${line}\n  Voice sample: ${text.slice(0, 500)}` : line;
  });
  return `Related posts already on the blog, most related first. Match their conventions; don't copy them:\n${lines.join("\n")}`;
}

/** The draft, with the body clipped to fit the prompt. */
export function describeDraft(draft: DraftInput): string {
  return `The draft:
Title: ${draft.title || "(none yet)"}
Subtitle: ${draft.subtitle || "(none)"}
Tags: ${draft.tags.join(", ") || "(none)"}
Body (markdown):
"""
${keepEnds(draft.body, 16_000) || "(empty)"}
"""`;
}

/** Over `max` characters, keep the opening and the ending (where a post's conclusion is) and drop the middle. */
function keepEnds(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, Math.round(max * 0.4))}\n\n[…middle of the post omitted…]\n\n${text.slice(-Math.round(max * 0.6))}`;
}

/** A string from the model's JSON as one clean line, without wrapping quotes; "" when it isn't a string. */
export function oneLine(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/\s+/g, " ")
    .replace(/^["'“”]+|["'“”]+$/g, "")
    .trim();
}
