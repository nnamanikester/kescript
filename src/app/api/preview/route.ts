import { renderCommentHtml } from "@/lib/markdown/pipeline";
import { isSameOrigin } from "@/lib/session";
import { json, MAX_COMMENT_LENGTH, readBody } from "@/lib/api";

/** Live preview for the comment editor — the exact renderer comments are shown with. */
export async function POST(req: Request) {
  if (!isSameOrigin(req)) return json({ error: "forbidden" }, 403);
  const input = await readBody<{ body?: string }>(req);
  if (typeof input?.body !== "string" || input.body.length > MAX_COMMENT_LENGTH) return json({ error: "invalid" }, 400);
  return json({ html: await renderCommentHtml(input.body) });
}
