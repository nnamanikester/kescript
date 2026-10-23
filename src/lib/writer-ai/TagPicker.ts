import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { parseJSON, type Passage } from "@/lib/rag";
import { slugify } from "@/lib/utils";
import { BlogTask, VOICE, describeDraft, draftSearchQuery, relatedPosts, type BlogSearch, type DraftInput, type PostInfo } from "./BlogTask";

const RULES = `Choose 2 to 5 tags for the post.
- Strongly prefer the blog's existing tags. Add a new tag only when the post is centrally about something no existing tag covers.
- Tags are lowercase and hyphenated, in the same style as the existing ones.
- Most important first.
Reply with JSON only: {"tags": ["...", "..."]}`;

/** Picks tags for the post, preferring the ones the blog already uses. */
export class TagPicker extends BlogTask<DraftInput, string[]> {
  constructor(
    llm: BaseChatModel,
    search: BlogSearch,
    /** The blog's tags with how many posts use each, most used first. */
    private readonly existingTags: { tag: string; count: number }[],
  ) {
    super(llm, search);
  }

  protected instructions() {
    return `You help the author of a blog finish a post's metadata. ${VOICE}\n\n${RULES}`;
  }

  protected searchQuery(draft: DraftInput) {
    return draftSearchQuery(draft);
  }

  protected prompt(draft: DraftInput, sources: Passage<PostInfo>[]) {
    const existing = this.existingTags
      .slice(0, 60)
      .map(({ tag, count }) => `${tag} (${count})`)
      .join(", ");
    return [
      relatedPosts(sources),
      existing && `The blog's existing tags, most used first:\n${existing}`,
      describeDraft(draft),
      draft.tags.length && `The post is tagged ${draft.tags.join(", ")} so far. Keep the tags that fit and complete the set.`,
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  protected parse(reply: string) {
    const { tags } = parseJSON<{ tags?: unknown }>(reply);
    // Models sometimes answer "a, b" instead of ["a", "b"].
    const list = Array.isArray(tags) ? tags : typeof tags === "string" ? tags.split(",") : [];
    const clean = [...new Set(list.map((tag) => slugify(String(tag))).filter(Boolean))].slice(0, 5);
    if (!clean.length) throw new Error("The model didn't return tags");
    return clean;
  }
}
