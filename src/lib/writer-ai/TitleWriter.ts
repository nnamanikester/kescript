import { parseJSON, type Passage } from "@/lib/rag";
import { BlogTask, VOICE, describeDraft, draftSearchQuery, oneLine, relatedPosts, type DraftInput, type PostInfo } from "./BlogTask";

const RULES = `Write the post's title.
- Under 70 characters. Specific: say what happened or what the reader will learn.
- Match the capitalisation and style of the blog's existing titles.
- No clickbait, no emoji, no surrounding quotes, no trailing period.
- Only claim what the body supports.
Reply with JSON only: {"title": "..."}`;

/** Suggests a title that fits the post and sounds like the blog's other titles. */
export class TitleWriter extends BlogTask<DraftInput, string> {
  protected instructions() {
    return `You help the author of a blog finish a post's metadata. ${VOICE}\n\n${RULES}`;
  }

  protected searchQuery(draft: DraftInput) {
    return draftSearchQuery(draft);
  }

  protected prompt(draft: DraftInput, sources: Passage<PostInfo>[]) {
    return [
      relatedPosts(sources),
      describeDraft(draft),
      draft.title && `The current title is "${draft.title}". Suggest a different, better one.`,
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  protected parse(reply: string) {
    const title = oneLine(parseJSON<{ title?: unknown }>(reply).title).replace(/\.$/, "");
    if (!title) throw new Error("The model didn't return a title");
    return title;
  }
}
