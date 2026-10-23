/**
 * The writer's AI assists. Each one is a RAG task (see @/lib/rag) over the
 * blog's published posts:
 *
 *   wand on the title        → TitleWriter
 *   wand on the tags         → TagPicker
 *   wand on the description  → DescriptionWriter
 *   "Ask AI" on a selection  → SelectionEditor
 */
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { getTags } from "@/lib/content";
import { draftSlug } from "@/lib/editor/draft";
import { createChatModel } from "@/lib/rag";
import { loadBlogSearch, type DraftInput } from "./BlogTask";
import { DescriptionWriter, type DescriptionSuggestion } from "./DescriptionWriter";
import { SelectionEditor, type EditInput } from "./SelectionEditor";
import { TagPicker } from "./TagPicker";
import { TitleWriter } from "./TitleWriter";

export { descriptionProblem } from "./DescriptionWriter";
export type { DraftInput, EditInput };

export const META_FIELDS = ["title", "description", "tags"] as const;
export type MetaField = (typeof META_FIELDS)[number];

/** What a wand fills in: one of these, depending on the field. */
export type MetaSuggestion = { title?: string; tags?: string[] } & Partial<DescriptionSuggestion>;

export interface AssistOptions {
  /** The chat model to use. Default: the one the env vars set up. */
  llm?: BaseChatModel;
  signal?: AbortSignal;
}

export function aiConfigured(): boolean {
  return createChatModel() !== null;
}

/** A suggestion for one of the draft's fields. */
export async function suggestMeta(field: MetaField, draft: DraftInput, { llm = requireModel(), signal }: AssistOptions = {}): Promise<MetaSuggestion> {
  const search = await loadBlogSearch();
  // The slug the post will get, so its own published version isn't used as a "related post".
  const input = { ...draft, slug: draftSlug(draft) };

  if (field === "title") {
    const { output } = await new TitleWriter(llm, search).run(input, signal);
    return { title: output };
  }
  if (field === "tags") {
    const { output } = await new TagPicker(llm, search, await getTags()).run(input, signal);
    return { tags: output };
  }
  const { output } = await new DescriptionWriter(llm, search).run(input, signal);
  return output;
}

/** The selected passage, rewritten as the instruction says. */
export async function editSelection(edit: EditInput, { llm = requireModel(), signal }: AssistOptions = {}): Promise<string> {
  const search = await loadBlogSearch();
  const { output } = await new SelectionEditor(llm, search).run(edit, signal);
  return output;
}

function requireModel(): BaseChatModel {
  const llm = createChatModel();
  if (!llm) throw new Error("AI isn't configured: set ANTHROPIC_API_KEY, GEMINI_API_KEY, or OPENAI_API_KEY with AI_MODEL");
  return llm;
}
