import { json, readBody, withOwner } from "@/lib/api";
import { processPost } from "@/lib/markdown/pipeline";

/** Renders a draft with the real post pipeline (Shiki, KaTeX, embeds) for the editor's Preview tab. */
export async function POST(req: Request) {
  return withOwner(req, async () => {
    const input = await readBody<{ body?: string }>(req);
    if (typeof input?.body !== "string" || input.body.length > 200_000) return json({ error: "invalid" }, 400);
    const { tree, headings } = await processPost(input.body);
    return json({ tree, headings });
  });
}
