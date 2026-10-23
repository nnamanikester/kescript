import { toPlainText } from "@/lib/content-text";
import { parseJSON, type Passage } from "@/lib/rag";
import { BlogTask, VOICE, describeDraft, draftSearchQuery, oneLine, relatedPosts, type DraftInput, type PostInfo } from "./BlogTask";

export interface DescriptionSuggestion {
  description: string;
  /** The passage the description was built from… */
  favorite?: string;
  /** …whether it's word for word in the post… */
  quoted?: boolean;
  /** …and the search phrase the description targets. */
  keyword?: string;
}

const RULES = `Write the meta description shown in search results and link previews, built from the post's favourite part. Work in three steps.

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

Reply with JSON only: {"favorite": "...", "keyword": "...", "description": "..."}`;

/**
 * Writes the meta description from the post's favourite passage, fitted to
 * search engine rules. A description that breaks a rule goes back to the model.
 */
export class DescriptionWriter extends BlogTask<DraftInput, DescriptionSuggestion> {
  protected instructions() {
    return `You help the author of a blog finish a post's metadata. ${VOICE}\n\n${RULES}`;
  }

  protected searchQuery(draft: DraftInput) {
    return draftSearchQuery(draft);
  }

  protected prompt(draft: DraftInput, sources: Passage<PostInfo>[]) {
    return [
      // A description has to sound like the author, so the model sees their prose, not just titles.
      relatedPosts(sources, { voice: true }),
      describeDraft(draft),
      draft.description && `The current description is "${draft.description}". Suggest a different, better one.`,
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  protected parse(reply: string, draft: DraftInput): DescriptionSuggestion {
    const data = parseJSON<{ description?: unknown; favorite?: unknown; keyword?: unknown }>(reply);
    // Plain text: a description is never shown as markdown.
    const description = toPlainText(oneLine(data.description));
    if (!description) throw new Error("The model didn't return a description");
    const favorite = oneLine(data.favorite);
    const keyword = oneLine(data.keyword).toLowerCase();
    return {
      description,
      ...(favorite && { favorite, quoted: words(draft.body).includes(words(favorite)) }),
      ...(keyword && { keyword }),
    };
  }

  protected findProblem(suggestion: DescriptionSuggestion) {
    return descriptionProblem(suggestion);
  }
}

/** The search engine rule a description breaks, or null when it passes them all. */
export function descriptionProblem({ description = "", keyword }: Partial<DescriptionSuggestion>): string | null {
  const length = description.length;
  if (length < 110 || length > 160) return `The description is ${length} characters; it must be 120 to 155.`;
  if (description.includes('"')) return "The description contains double quotes, which search engines cut descriptions at.";
  // Match on word stems, so "memoising" counts for "memoise".
  const missing = (keyword ? words(keyword).split(" ") : []).filter((word) => word.length > 2 && !words(description).includes(word.slice(0, 5)));
  if (missing.length) return `The description doesn't include the search phrase "${keyword}".`;
  return null;
}

/** Lowercase words only, so punctuation and markdown don't decide whether two texts match. */
function words(text: string): string {
  return toPlainText(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}
