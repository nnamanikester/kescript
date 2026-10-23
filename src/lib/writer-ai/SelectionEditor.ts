import { toPlainText } from "@/lib/content-text";
import { SITE } from "@/lib/site";
import { unfence, type Passage } from "@/lib/rag";
import { BlogTask, VOICE, type PostInfo } from "./BlogTask";

/** A passage the author selected in the editor, and what they want done with it. */
export interface EditInput {
  instruction: string;
  /** The selected passage, as markdown. */
  selection: string;
  /** Text just before and after the selection, so the result fits in place. */
  before: string;
  after: string;
  title: string;
  slug: string;
}

const RULES = `You are the editor inside ${SITE.author}'s blog editor. ${VOICE}

The author selects a passage of a post and tells you what to do with it. You return the new version of that passage, which replaces the selection.

Rules:
- Reply with the replacement passage only, in Markdown: no preamble, no explanation, no quotes around it, and no code fence around the whole reply unless the passage is itself a code block.
- Keep the author's voice. The excerpts from other posts show it.
- Keep the meaning and every fact unless the instruction says otherwise. Never invent facts, numbers, quotes or experiences.
- Keep the passage's Markdown (links, inline code, emphasis, lists) unless told to change it.
- If the selection is part of a sentence, return a fragment that reads correctly in place, using the surrounding text.
- You may link to the blog's other posts as [text](/blog/slug), but only to posts listed in the excerpts, and only when asked or when it clearly helps.`;

/** Rewrites a selected passage as the author asks, with excerpts from other posts for voice and links. */
export class SelectionEditor extends BlogTask<EditInput, string> {
  protected perPost = 2;

  protected instructions() {
    return RULES;
  }

  protected searchQuery(edit: EditInput) {
    return `${edit.instruction} ${toPlainText(edit.selection)}`;
  }

  protected prompt(edit: EditInput, sources: Passage<PostInfo>[]) {
    const excerpts = sources.map(({ meta, text }, n) => `[${n + 1}] "${meta.title}" (/blog/${meta.slug})\n${text}`).join("\n\n");
    return [
      excerpts && `Excerpts from the author's other posts:\n\n${excerpts}`,
      `Post title: ${edit.title || "(untitled)"}`,
      edit.before && `Text just before the selection:\n"""\n${edit.before}\n"""`,
      `SELECTED PASSAGE:\n"""\n${edit.selection}\n"""`,
      edit.after && `Text just after the selection:\n"""\n${edit.after}\n"""`,
      `Instruction: ${edit.instruction}`,
      "Reply with the replacement passage only.",
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  protected parse(reply: string, edit: EditInput) {
    // A selected code block legitimately comes back fenced.
    const isCodeBlock = /^\s*(```|~~~)/.test(edit.selection);
    const text = isCodeBlock ? reply.trim() : unfence(reply);
    if (!text) throw new Error("The model returned nothing");
    return text;
  }
}
