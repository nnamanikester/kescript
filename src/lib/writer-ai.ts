/**
 * The writer's AI assists: two RAGBase graphs (LangChain + LangGraph, ./rag).
 * Retrieval runs over the published posts, so suggestions reuse the blog's
 * tags, sound like its other titles, and can link to related posts.
 */
import { getPosts, getTags } from "@/lib/content";
import { toPlainText } from "@/lib/content-text";
import { draftSlug } from "@/lib/editor/draft";
import { SITE } from "@/lib/site";
import { slugify } from "@/lib/utils";
import { Document, type DocumentInterface } from "@langchain/core/documents";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { KeywordRetriever, RAGBase, chatModelFromEnv, parseJSON, splitMarkdown, unfence } from "@/lib/rag";

export const META_FIELDS = ["title", "description", "tags"] as const;
export type MetaField = (typeof META_FIELDS)[number];

interface PostInfo {
  slug: string;
  title: string;
  description: string;
  tags: string[];
}

export interface DraftInput {
  title: string;
  subtitle: string;
  description: string;
  tags: string[];
  slug: string;
  body: string;
}

export interface MetaSuggestion {
  title?: string;
  description?: string;
  /** With a description: the passage it was built from… */
  favorite?: string;
  /** …whether that passage is word for word in the post… */
  quoted?: boolean;
  /** …and the search phrase it targets. */
  keyword?: string;
  tags?: string[];
}

export interface EditInput {
  instruction: string;
  /** The selected passage, as markdown. */
  selection: string;
  before: string;
  after: string;
  title: string;
  slug: string;
}

export interface AssistOptions {
  /** Defaults to the model configured by env (see chatModelFromEnv). */
  llm?: BaseChatModel;
  signal?: AbortSignal;
}

export function aiConfigured(): boolean {
  return chatModelFromEnv() !== null;
}

function requireModel(): BaseChatModel {
  const llm = chatModelFromEnv();
  if (!llm) throw new Error("AI isn't configured: set ANTHROPIC_API_KEY, GEMINI_API_KEY, or OPENAI_API_KEY with AI_MODEL");
  return llm;
}

/**
 * Every published post, split and indexed for BM25. Rebuilt per request: a few
 * ms at blog scale. `k` over-fetches so filtering out the current post still leaves enough.
 */
async function blogRetriever(k: number) {
  const posts = await getPosts();
  const docs = posts.map(
    (p) =>
      new Document<PostInfo>({
        pageContent: `${p.title}\n\n${p.body}`,
        metadata: { slug: p.slug, title: p.title, description: p.description, tags: p.tags },
      }),
  );
  return new KeywordRetriever({ docs: await splitMarkdown(docs, { chunkSize: 900, clean: toPlainText }), k });
}

const info = (d: DocumentInterface) => d.metadata as PostInfo;

/** Leave out the post being written, and cap how much any one post contributes. */
function others(exclude: string, perPost: number) {
  return (docs: DocumentInterface[]) => {
    const seen = new Map<string, number>();
    return docs.filter((d) => {
      const { slug } = info(d);
      if (slug === exclude) return false;
      const n = seen.get(slug) ?? 0;
      seen.set(slug, n + 1);
      return n < perPost;
    });
  };
}

const VOICE = `The blog is ${SITE.name}, by ${SITE.author}: "${SITE.description}" The voice is plain, direct and first person, specific rather than grand, and never salesy.`;

/** Over `n` characters, keep the opening and the ending: a post's conclusion is at the end. */
const clip = (s: string, n: number) =>
  s.length > n ? `${s.slice(0, Math.round(n * 0.4))}\n\n[…middle of the post omitted…]\n\n${s.slice(-Math.round(n * 0.6))}` : s;

/* ───────────────────────────── title, description, tags ───────────────────────────── */

const FIELD_RULES: Record<MetaField, string> = {
  title: `Write the post's title.
- Under 70 characters. Specific: say what happened or what the reader will learn.
- Match the capitalisation and style of the blog's existing titles.
- No clickbait, no emoji, no surrounding quotes, no trailing period.
- Only claim what the body supports.
Reply with JSON only: {"title": "..."}`,
  description: `Write the meta description shown in search results and link previews, built from the post's favourite part. Work in three steps.

Step 1, the favourite part. Read the whole post and pick the passage a reader would most want to quote or share: the sharpest line, the hard-won insight, the moment it clicks. Copy it exactly as the author wrote it, one to three sentences.

Step 2, the search phrase. The two-to-five-word phrase someone would type into a search engine to find this post. It must be what the post is actually about.

Step 3, the description: the favourite part, fitted to search engine rules. Change as little of the author's wording as you can.
- 120 to 155 characters, so search results show it whole instead of cutting it off.
- Include the search phrase naturally, as early as reads well. Never stuff keywords.
- Complete sentences that make sense without the post: replace "this", "it" or "here" with what they refer to.
- Plain text only: no double quotes (search engines cut descriptions at them), no emoji, hashtags, markdown or line breaks.
- Accurate: promise exactly what the post delivers.
- If the favourite part is too long, tighten it; if too short, add the context from the post that makes it land.
- Keep the author's voice: their person (I, you, we), rhythm and word choice. The voice samples show it. Don't start with "In this post" or "Learn how".

Reply with JSON only: {"favorite": "...", "keyword": "...", "description": "..."}`,
  tags: `Choose 2 to 5 tags for the post.
- Strongly prefer the blog's existing tags. Add a new tag only when the post is centrally about something no existing tag covers.
- Tags are lowercase and hyphenated, in the same style as the existing ones.
- Most important first.
Reply with JSON only: {"tags": ["...", "..."]}`,
};

type MetaInput = DraftInput & { field: MetaField; knownTags: string };

/** Lowercase words only, so quotes, dashes and markdown don't decide whether a passage matches. */
const words = (s: string) => toPlainText(s).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

/** Search engine rules for a meta description, checked in code; a broken one goes back to the model. */
export function descriptionProblem({ description = "", keyword }: MetaSuggestion): string | null {
  const n = description.length;
  if (n < 110 || n > 160) return `The description is ${n} characters; it must be 120 to 155.`;
  if (description.includes('"')) return "The description contains double quotes, which search engines cut descriptions at.";
  const missing = (keyword ? words(keyword).split(" ") : []).filter((w) => w.length > 2 && !words(description).includes(w.slice(0, 5)));
  if (missing.length) return `The description doesn't include the search phrase "${keyword}".`;
  return null;
}

function parseMeta(text: string, { field, body }: MetaInput): MetaSuggestion {
  const data = parseJSON<Record<string, unknown>>(text);
  const value = data[field];
  if (field === "tags") {
    if (!Array.isArray(value)) throw new Error("The model didn't return tags");
    const tags = [...new Set(value.map((t) => slugify(String(t))).filter(Boolean))].slice(0, 5);
    if (!tags.length) throw new Error("The model didn't return tags");
    return { tags };
  }
  const tidy = (v: unknown) => (typeof v === "string" ? v.replace(/\s+/g, " ").replace(/^["'“”]+|["'“”]+$/g, "").trim() : "");
  const clean = tidy(value);
  if (!clean) throw new Error(`The model didn't return a ${field}`);
  if (field === "title") return { title: clean.replace(/\.$/, "") };
  const favorite = tidy(data.favorite);
  return {
    // Plain text: a description is never rendered as markdown.
    description: toPlainText(clean),
    ...(favorite && { favorite, quoted: words(body).includes(words(favorite)) }),
    ...(tidy(data.keyword) && { keyword: tidy(data.keyword).toLowerCase() }),
  };
}

export async function suggestMeta(field: MetaField, draft: DraftInput, { llm, signal }: AssistOptions = {}): Promise<MetaSuggestion> {
  const [retriever, tags] = await Promise.all([blogRetriever(15), getTags()]);
  const task = new RAGBase<MetaInput, MetaSuggestion>({
    llm: llm ?? requireModel(),
    retriever,
    topK: 5,
    instructions: (i) => `You help the author of a blog finish a post's metadata. ${VOICE}\n\n${FIELD_RULES[i.field]}`,
    query: (i) => `${i.title} ${i.subtitle} ${toPlainText(i.body).slice(0, 1500)}`,
    filter: (docs, i) => others(draftSlug(i), 1)(docs),
    formatContext: (docs, i) =>
      docs
        .map((d) => {
          const p = info(d);
          const line = `- "${p.title}": ${p.description}${p.tags.length ? ` (tags: ${p.tags.join(", ")})` : ""}`;
          // A description has to sound like the author, so it gets their actual prose, not just metadata.
          return i.field === "description" ? `${line}\n  Voice sample: ${d.pageContent.slice(0, 500)}` : line;
        })
        .join("\n"),
    prompt: (i, context) => {
      const current = i.field === "tags" ? i.tags.join(", ") : i[i.field];
      return [
        context && `Related posts already on the blog, most related first. Match their conventions; don't copy them:\n${context}`,
        i.field === "tags" && i.knownTags && `The blog's existing tags, most used first:\n${i.knownTags}`,
        `The draft:
Title: ${i.title || "(none yet)"}
Subtitle: ${i.subtitle || "(none)"}
Tags: ${i.tags.join(", ") || "(none)"}
Body (markdown):
"""
${clip(i.body, 16_000) || "(empty)"}
"""`,
        current &&
          (i.field === "tags"
            ? `The post is tagged ${current} so far. Keep the tags that fit and complete the set.`
            : `The current ${i.field} is "${current}". Suggest a different, better one.`),
      ]
        .filter(Boolean)
        .join("\n\n");
    },
    parse: parseMeta,
    validate: (out, i) => (i.field === "description" ? descriptionProblem(out) : null),
  });

  const knownTags = tags
    .slice(0, 60)
    .map((t) => `${t.tag} (${t.count})`)
    .join(", ");
  return (await task.run({ ...draft, field, knownTags }, { signal })).output;
}

/* ───────────────────────────── selection edits ───────────────────────────── */

const EDIT_RULES = `You are the editor inside ${SITE.author}'s blog editor. ${VOICE}

The author selects a passage of a post and tells you what to do with it. You return the new version of that passage, which replaces the selection.

Rules:
- Reply with the replacement passage only, in Markdown: no preamble, no explanation, no quotes around it, and no code fence around the whole reply unless the passage is itself a code block.
- Keep the author's voice. The excerpts from other posts show it.
- Keep the meaning and every fact unless the instruction says otherwise. Never invent facts, numbers, quotes or experiences.
- Keep the passage's Markdown (links, inline code, emphasis, lists) unless told to change it.
- If the selection is part of a sentence, return a fragment that reads correctly in place, using the surrounding text.
- You may link to the blog's other posts as [text](/blog/slug), but only to posts listed in the excerpts, and only when asked or when it clearly helps.`;

export async function editSelection(input: EditInput, { llm, signal }: AssistOptions = {}): Promise<string> {
  const task = new RAGBase<EditInput, string>({
    llm: llm ?? requireModel(),
    retriever: await blogRetriever(15),
    topK: 5,
    instructions: EDIT_RULES,
    query: (i) => `${i.instruction} ${toPlainText(i.selection)}`,
    filter: (docs, i) => others(i.slug, 2)(docs),
    formatContext: (docs) => docs.map((d, n) => `[${n + 1}] "${info(d).title}" (/blog/${info(d).slug})\n${d.pageContent}`).join("\n\n"),
    prompt: (i, context) =>
      [
        context && `Excerpts from the author's other posts:\n\n${context}`,
        `Post title: ${i.title || "(untitled)"}`,
        i.before && `Text just before the selection:\n"""\n${i.before}\n"""`,
        `SELECTED PASSAGE:\n"""\n${i.selection}\n"""`,
        i.after && `Text just after the selection:\n"""\n${i.after}\n"""`,
        `Instruction: ${i.instruction}`,
        "Reply with the replacement passage only.",
      ]
        .filter(Boolean)
        .join("\n\n"),
    // A selected code block legitimately comes back fenced.
    parse: (text, i) => (/^\s*(```|~~~)/.test(i.selection) ? text.trim() : unfence(text)),
  });
  const out = (await task.run(input, { signal })).output;
  if (!out) throw new Error("The model returned nothing");
  return out;
}
