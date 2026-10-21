import { json, readBody, withOwner } from "@/lib/api";
import { aiConfigured, editSelection, META_FIELDS, suggestMeta, type MetaField } from "@/lib/writer-ai";

export const maxDuration = 60;

type Body =
  | { task: "meta"; field: MetaField; draft: Record<string, unknown> }
  | { task: "edit"; instruction: string; selection: string; before?: string; after?: string; title?: string; slug?: string };

const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");

/** Provider errors (SDK errors, our LLMError) carry an HTTP status; map them to something the editor can show. */
function aiError(err: unknown) {
  const e = err as { status?: unknown; message?: unknown; name?: unknown };
  if (e?.name === "AbortError") return json({ error: "aborted" }, 499);
  console.error("[ai]", err);
  const message = typeof e?.message === "string" ? e.message : "The AI request failed";
  if (e?.status === 401 || e?.status === 403) return json({ error: "ai", message: "The AI provider rejected the API key" }, 502);
  if (e?.status === 429) return json({ error: "ai", message: "The AI provider is rate limiting — try again in a minute" }, 429);
  if (e?.status === 503 || e?.status === 529) {
    return json({ error: "ai", message: "The AI model is overloaded right now — try again shortly, or set AI_MODEL to another model" }, 503);
  }
  return json({ error: "ai", message }, 502);
}

/** Owner-only AI assists for the writer: metadata suggestions and selection edits. */
export async function POST(req: Request) {
  return withOwner(req, async () => {
    if (!aiConfigured()) return json({ error: "ai", message: "AI isn't configured on this deployment" }, 501);
    const input = await readBody<Body>(req);

    try {
      if (input?.task === "meta") {
        if (!META_FIELDS.includes(input.field)) return json({ error: "invalid" }, 400);
        const d = input.draft ?? {};
        const draft = {
          title: str(d.title, 300),
          subtitle: str(d.subtitle, 500),
          description: str(d.description, 500),
          slug: str(d.slug, 200),
          tags: Array.isArray(d.tags) ? d.tags.map(String).slice(0, 12) : [],
          body: str(d.body, 60_000),
        };
        if (!draft.body.trim() && !(input.field !== "title" && draft.title)) {
          return json({ error: "invalid", message: "Write a little of the post first" }, 400);
        }
        return json(await suggestMeta(input.field, draft, { signal: req.signal }));
      }

      if (input?.task === "edit") {
        const instruction = str(input.instruction, 2000).trim();
        const selection = str(input.selection, 30_000);
        if (!instruction || !selection.trim()) return json({ error: "invalid", message: "Say what to do with the selection" }, 400);
        const text = await editSelection(
          {
            instruction,
            selection,
            before: str(input.before, 3000),
            after: str(input.after, 3000),
            title: str(input.title, 300),
            slug: str(input.slug, 200),
          },
          { signal: req.signal },
        );
        return json({ text });
      }
    } catch (err) {
      return aiError(err);
    }
    return json({ error: "invalid" }, 400);
  });
}
